import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import jsQR from 'jsqr';
import { AlertCircle, Camera, CameraOff, CheckCircle, ExternalLink, Loader2, QrCode, Search, UserCheck, Blocks } from 'lucide-react';
import { CardanoWallet, useWallet } from '@meshsdk/react';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { getCheckInWindow } from '@/lib/eventLifecycle';
import { explorerTxUrl, submitOnChainProof, truncateMiddle } from '@/lib/cardano';
import type { Registration } from '@/types';

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats: string[] }) => BarcodeDetectorLike;
  }
}

export default function EventAttendance() {
  const { id } = useParams<{ id: string }>();
  const event = store.getEventById(id || '');
  const { connected, wallet, address } = useWallet();
  const [code, setCode] = useState('');
  const [query, setQuery] = useState('');
  const [handledBy, setHandledBy] = useState('organizer');
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [cardanoBusy, setCardanoBusy] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const registrations = event ? store.getEventRegistrations(event.id) : [];
  const approvedVolunteers = useMemo(
    () => (event ? store.getEventVolunteerApplications(event.id).filter(a => a.status === 'approved') : []),
    [event, version],
  );

  const stopScan = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => stopScan(), []);

  if (!event) {
    return (
      <DashboardLayout title="Check-In">
        <p className="text-[#5E6256]">Event not found</p>
      </DashboardLayout>
    );
  }

  const attended = registrations.filter(r => r.status === 'attended');
  const approved = registrations.filter(r => r.status === 'approved');
  const checkInWindow = getCheckInWindow(event);
  const attendanceClosed = !checkInWindow.canCheckIn;

  const handledByName = () => {
    if (handledBy === 'organizer') return '';
    return approvedVolunteers.find(v => v.volunteer_id === handledBy)?.volunteer?.full_name || '';
  };

  const doCheckIn = (reg: Registration, method: 'manual' | 'qr' | 'cardano', chain?: { txHash: string; walletAddress: string }) => {
    store.checkInRegistration(reg, {
      method,
      handledById: handledBy === 'organizer' ? undefined : handledBy,
      handledByName: handledByName(),
      txHash: chain?.txHash,
      walletAddress: chain?.walletAddress,
      explorerUrl: chain?.txHash ? explorerTxUrl(chain.txHash) : undefined,
    });
    setMessage({
      text: chain?.txHash
        ? `On-chain check-in: ${reg.participant?.full_name || reg.registration_code} · ${truncateMiddle(chain.txHash)}`
        : `Checked in: ${reg.participant?.full_name || reg.registration_code}`,
      type: 'success',
    });
    if (chain?.txHash) setLastTx(chain.txHash);
    setCode('');
    setVersion(v => v + 1);
  };

  const cardanoCheckIn = async (reg: Registration) => {
    if (!connected || !wallet) {
      setMessage({ text: 'Connect a Cardano Preprod wallet first.', type: 'error' });
      return;
    }
    if (!event) return;
    const window = getCheckInWindow(event);
    if (!window.canCheckIn) {
      setMessage({ text: window.message, type: 'error' });
      return;
    }
    setCardanoBusy(true);
    setMessage(null);
    try {
      const result = await submitOnChainProof(wallet, {
        kind: 'attendance',
        eventId: event.id,
        eventTitle: event.title,
        registrationCode: reg.registration_code || '',
        role: 'participant',
        participantId: reg.participant_id,
        session: 'Main Session',
        location: event.city || event.venue || '',
      });
      doCheckIn(reg, 'cardano', { txHash: result.txHash, walletAddress: result.walletAddress });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : String(err), type: 'error' });
    } finally {
      setCardanoBusy(false);
    }
  };

  const resolveApprovedFromCode = (raw: string): Registration | null => {
    const value = raw.trim().toUpperCase();
    if (!value || !event) return null;
    const reg = store.getRegistrationByCode(value);
    if (!reg || reg.event_id !== event.id || reg.status !== 'approved') return null;
    return store.getEventRegistrations(event.id).find(r => r.id === reg.id) || reg;
  };

  const verifyCode = (raw: string, method: 'manual' | 'qr' = 'manual'): boolean => {
    setMessage(null);
    if (attendanceClosed) {
      setMessage({ text: checkInWindow.message || 'Check-in is not open for this event right now.', type: 'error' });
      return false;
    }

    const value = raw.trim().toUpperCase();
    if (!value) return false;

    const reg = store.getRegistrationByCode(value);
    if (!reg) {
      setMessage({ text: 'Invalid registration code', type: 'error' });
      return false;
    }
    if (reg.event_id !== event.id) {
      setMessage({ text: 'Code belongs to a different event', type: 'error' });
      return false;
    }
    if (reg.status === 'pending') {
      setMessage({ text: 'This registration is still pending approval.', type: 'error' });
      return false;
    }
    if (reg.status === 'rejected') {
      setMessage({ text: 'This registration was rejected.', type: 'error' });
      return false;
    }
    if (reg.status === 'attended') {
      setMessage({ text: 'Already checked in', type: 'error' });
      return false;
    }
    if (reg.status !== 'approved') {
      setMessage({ text: 'Only approved registrations can be checked in.', type: 'error' });
      return false;
    }

    doCheckIn(store.getEventRegistrations(event.id).find(r => r.id === reg.id) || reg, method);
    return true;
  };

  const startScan = async () => {
    setScanError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current;
      if (!video) throw new Error('Camera preview is not ready.');
      video.srcObject = stream;
      await video.play();

      const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      const tick = async () => {
        if (!streamRef.current) return;
        try {
          let scannedValue = '';

          if (detector) {
            const codes = await detector.detect(video);
            scannedValue = codes[0]?.rawValue || '';
          }

          if (!scannedValue && context && video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            scannedValue = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })?.data || '';
          }

          if (scannedValue) {
            setCode(scannedValue.trim().toUpperCase());
            const ok = verifyCode(scannedValue, 'qr');
            if (ok) {
              stopScan();
              return;
            }
          }
        } catch {
          // Keep scanning while the camera stream is active.
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setScanError('Could not access the camera. Check permissions or use manual entry.');
      setScanning(false);
    }
  };

  const filteredApproved = approved.filter(r => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (r.participant?.full_name || '').toLowerCase().includes(q) || (r.registration_code || '').toLowerCase().includes(q);
  });

  return (
    <DashboardLayout title="Event Check-In">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#DCE8BE] bg-[#F9F8F1] p-4 shadow-[0_24px_70px_rgba(82,103,15,0.10)] sm:p-6">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#EEF5D9] to-transparent" />
          <div className="relative mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DCE8BE] bg-[#EEF5D9] text-[#52670F] shadow-sm">
                <QrCode className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#52670F]">Live entry desk</p>
                <h2 className="text-xl font-black leading-tight text-[#14150F]">Scan QR or enter code</h2>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-[24rem]">
              {[
                ['Total', registrations.length],
                ['Inside', attended.length],
                ['Waiting', approved.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#E7E1D2] bg-white/78 px-3 py-2 text-center shadow-sm">
                  <p className="text-xl font-black text-[#14150F]">{value}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5E6256]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-[#DCE8BE] bg-[radial-gradient(circle_at_50%_20%,rgba(220,233,183,0.95),transparent_20rem),linear-gradient(135deg,#F8F7EE,#F6FAE8)] p-3 shadow-inner">
            <div className="absolute left-5 top-5 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-[#52670F]/55" />
            <div className="absolute right-5 top-5 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-[#52670F]/55" />
            <div className="absolute bottom-5 left-5 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-[#52670F]/55" />
            <div className="absolute bottom-5 right-5 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-[#52670F]/55" />
            <div className="relative flex aspect-[16/9] min-h-[16rem] items-center justify-center overflow-hidden rounded-[1.15rem] border border-white/75 bg-[#EEF5D9]">
              <video ref={videoRef} className={`h-full w-full object-cover ${scanning ? '' : 'hidden'}`} muted playsInline />
              {!scanning && (
                <div className="max-w-sm px-5 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#DCE8BE] bg-[#F9F8F1] shadow-[0_18px_36px_rgba(82,103,15,0.12)]">
                    <Camera className="h-8 w-8 text-[#52670F]" />
                  </div>
                  <p className="text-sm font-black text-[#424638]">Ready for QR verification</p>
                  <p className="mt-1 text-xs leading-5 text-[#5E6256]">Start scanning when the attendee reaches the desk, or use the manual code below.</p>
                </div>
              )}
              {scanning && (
                <>
                  <span className="absolute right-4 top-4 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm">Scanning</span>
                  <span className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-[#D7FF62] to-transparent shadow-[0_0_22px_rgba(215,255,98,0.9)]" />
                </>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-[#5E6256]">Manual registration code</span>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') verifyCode(code); }}
                  disabled={attendanceClosed}
                  className="mono-text w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-base font-black tracking-[0.08em] text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
                  placeholder="OCI-XXXXXX"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-[#5E6256]">Handled by</span>
                <select
                  value={handledBy}
                  onChange={e => setHandledBy(e.target.value)}
                  className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-sm font-semibold text-[#14150F] focus:border-[#52670F]/50 focus:outline-none"
                >
                  <option value="organizer">Organizer (me)</option>
                  {approvedVolunteers.map(v => (
                    <option key={v.id} value={v.volunteer_id}>
                      {v.volunteer?.full_name || 'Volunteer'} - earns 15 pts
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              {!scanning ? (
                <button onClick={startScan} disabled={attendanceClosed} className="gold-btn flex items-center justify-center gap-2 disabled:opacity-50">
                  <Camera className="h-4 w-4" /> Start QR Scan
                </button>
              ) : (
                <button onClick={stopScan} className="ghost-btn flex items-center justify-center gap-2 rounded-full">
                  <CameraOff className="h-4 w-4" /> Stop Scan
                </button>
              )}
              <button onClick={() => verifyCode(code)} disabled={attendanceClosed} className="gold-btn flex items-center justify-center gap-2 disabled:opacity-50">
                <UserCheck className="h-4 w-4" /> Verify & Check In
              </button>
            </div>
          </div>

          {scanError && <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">{scanError}</p>}
          {attendanceClosed && (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              {checkInWindow.message}
            </p>
          )}
          {!attendanceClosed && (
            <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
              {checkInWindow.message}
            </p>
          )}
          {message && (
            <div className={`mt-3 flex items-center gap-2 rounded-2xl border px-4 py-3 ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
              {message.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span className="text-sm font-semibold">{message.text}</span>
            </div>
          )}

          {/* Cardano on-chain check-in */}
          <div className="mt-5 rounded-[1.5rem] border border-[#C9D9A0] bg-gradient-to-br from-[#F6FAE8] to-[#EEF5D9] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#52670F] text-white shadow-sm">
                  <Blocks className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#52670F]">Cardano Preprod</p>
                  <h3 className="text-base font-black text-[#14150F]">On-chain attendance proof</h3>
                  <p className="mt-1 text-xs leading-5 text-[#5E6256]">
                    Connect a wallet, enter an approved registration code, then sign a metadata transaction.
                    Proof is permanent on Cardano — no private keys leave the wallet.
                  </p>
                  {connected && address && (
                    <p className="mt-2 font-mono text-[11px] text-[#52670F]">{truncateMiddle(address, 12, 8)}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <CardanoWallet label="Connect Wallet" persist isDark={false} />
                <button
                  type="button"
                  disabled={attendanceClosed || cardanoBusy || !connected}
                  onClick={() => {
                    const reg = resolveApprovedFromCode(code);
                    if (!reg) {
                      setMessage({ text: 'Enter a valid approved registration code first.', type: 'error' });
                      return;
                    }
                    void cardanoCheckIn(reg);
                  }}
                  className="gold-btn flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cardanoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Blocks className="h-4 w-4" />}
                  {cardanoBusy ? 'Signing…' : 'Check In On-Chain'}
                </button>
              </div>
            </div>
            {lastTx && (
              <a
                href={explorerTxUrl(lastTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#52670F] hover:underline"
              >
                View proof on explorer <ExternalLink className="h-3.5 w-3.5" />
                <span className="font-mono font-medium text-[#5E6256]">{truncateMiddle(lastTx)}</span>
              </a>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-[#DCE8BE] bg-[#F9F8F1] p-4 shadow-[0_20px_55px_rgba(82,103,15,0.08)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#52670F]">Approval queue</p>
                <h3 className="text-lg font-black text-[#14150F]">Tap to check in ({approved.length})</h3>
              </div>
              <span className="rounded-full border border-[#DCE8BE] bg-[#EEF5D9] px-3 py-1 text-xs font-black text-[#52670F]">{filteredApproved.length} shown</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6256]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search name or code"
                className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] py-3 pl-11 pr-3 text-sm font-semibold text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
              />
            </div>
            <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
              {approved.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#D9D0B8] bg-[#F7F6EB] px-4 py-8 text-center text-sm font-semibold text-[#5E6256]">No approved participants awaiting check-in.</p>
              ) : filteredApproved.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#D9D0B8] bg-[#F7F6EB] px-4 py-8 text-center text-sm font-semibold text-[#5E6256]">No matches for "{query}".</p>
              ) : filteredApproved.map((reg) => (
                <div key={reg.id} className="group flex items-center gap-3 rounded-2xl border border-[#E7E1D2] bg-white/82 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#CFE2A1] hover:shadow-[0_16px_36px_rgba(82,103,15,0.12)]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF5D9] text-sm font-black text-[#52670F]">
                    {reg.participant?.full_name?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#14150F]">{reg.participant?.full_name || 'Unknown'}</p>
                    <p className="mono-text truncate text-[10px] font-bold text-[#5E6256]">{reg.registration_code}</p>
                  </div>
                  <button
                    onClick={() => doCheckIn(reg, 'manual')}
                    disabled={attendanceClosed}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#52670F] px-3 py-2 text-[11px] font-black text-white transition-colors hover:bg-[#41520B] disabled:opacity-40"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Check In
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#DCE8BE] bg-[#F9F8F1] p-4 shadow-[0_20px_55px_rgba(82,103,15,0.08)] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#52670F]">Inside venue</p>
                <h3 className="text-lg font-black text-[#14150F]">Checked-in attendees ({attended.length})</h3>
              </div>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="max-h-[18rem] space-y-2 overflow-y-auto pr-1">
              {attended.length === 0 && <p className="rounded-2xl border border-dashed border-[#D9D0B8] bg-[#F7F6EB] px-4 py-8 text-center text-sm font-semibold text-[#5E6256]">No check-ins yet.</p>}
              {attended.map((reg) => (
                <div key={reg.id} className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#14150F]">{reg.participant?.full_name || 'Unknown'}</p>
                    <p className="mono-text truncate text-[10px] font-bold text-emerald-700">{reg.registration_code}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </DashboardLayout>
  );
}
