import { useState } from 'react';
import { Link } from 'react-router';
import { CardanoWallet, useWallet } from '@meshsdk/react';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { Ticket, Calendar, MapPin, Clock, CheckCircle, XCircle, Shield, Blocks, Loader2, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { explorerTxUrl, submitOnChainProof, truncateMiddle } from '@/lib/cardano';
import { getCheckInWindow } from '@/lib/eventLifecycle';
import type { Registration } from '@/types';

const statusOrder: Registration['status'][] = ['pending', 'approved', 'rejected', 'attended', 'cancelled'];

const statusLabels: Record<Registration['status'], string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  attended: 'Attended',
  cancelled: 'Cancelled',
};

function statusClasses(status: Registration['status']) {
  if (status === 'pending') return 'bg-amber-500/20 text-amber-300';
  if (status === 'approved') return 'bg-blue-500/20 text-blue-300';
  if (status === 'attended') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'rejected') return 'bg-red-500/20 text-red-300';
  return 'bg-white/10 text-white/40';
}

export default function ParticipantTickets() {
  const user = store.getCurrentUser();
  const { connected, wallet } = useWallet();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  void version;
  const registrations = user ? store.getParticipantRegistrations(user.id) : [];
  const events = store.getEvents();

  const selfCheckIn = async (reg: Registration) => {
    if (!connected || !wallet) {
      setError('Connect a Cardano Preprod wallet first.');
      return;
    }
    const event = events.find(e => e.id === reg.event_id);
    if (!event) return;

    const window = getCheckInWindow(event);
    if (!window.canCheckIn) {
      setError(window.message);
      return;
    }
    if (reg.status !== 'approved') {
      setError('Only approved tickets can check in. Wait for organizer approval.');
      return;
    }

    setBusyId(reg.id);
    setError('');
    try {
      const result = await submitOnChainProof(wallet, {
        kind: 'attendance',
        eventId: event.id,
        eventTitle: event.title,
        registrationCode: reg.registration_code || '',
        role: 'participant',
        participantId: reg.participant_id,
        location: event.city || event.venue || '',
      });
      store.checkInRegistration(reg, {
        method: 'cardano',
        txHash: result.txHash,
        walletAddress: result.walletAddress,
        explorerUrl: explorerTxUrl(result.txHash),
      });
      setVersion(v => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout title="My Tickets">
      <div className="mb-5 rounded-2xl border border-[#DCE8BE] bg-[#F6FAE8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#52670F]">Cardano self check-in</p>
          <p className="text-sm text-[#5E6256] mt-1">
            <strong>Approval ≠ check-in.</strong> After you are approved, check-in unlocks only on event day
            (from 1 hour before start until end time). Then connect Lace and prove attendance on Cardano.
          </p>
        </div>
        <CardanoWallet label="Connect Wallet" persist isDark={false} />
      </div>
      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}
      {registrations.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Ticket className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No registrations yet. Browse events to apply!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map((status) => {
            const group = registrations.filter(registration => registration.status === status);
            if (group.length === 0) return null;

            return (
              <section key={status}>
                <h2 className="text-sm font-semibold text-white mb-3">{statusLabels[status]}</h2>
                <div className="grid gap-4">
                  {group.map((reg) => {
                    const event = events.find(e => e.id === reg.event_id);
                    if (!event) return null;
                    const hasTicket = (reg.status === 'approved' || reg.status === 'attended') && Boolean(reg.registration_code);

                    return (
                      <div key={reg.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white mb-1">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-white/30">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue}, {event.city}</span>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full mt-3 inline-flex items-center gap-1 ${statusClasses(reg.status)}`}>
                            {reg.status === 'pending' && <Clock className="w-3 h-3" />}
                            {(reg.status === 'approved' || reg.status === 'attended') && <CheckCircle className="w-3 h-3" />}
                            {reg.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {statusLabels[reg.status]}
                          </span>

                          {reg.status === 'pending' && (
                            <p className="text-xs text-white/35 mt-3">Waiting for organizer approval. QR ticket will appear after approval.</p>
                          )}
                          {reg.status === 'rejected' && (
                            <p className="text-xs text-red-200/80 mt-3">{reg.rejection_reason || 'This registration was rejected.'}</p>
                          )}
                          {reg.status === 'attended' && (
                            <p className="text-xs text-emerald-200/80 mt-3">Attendance verified. Certificate eligibility may be available from the organizer.</p>
                          )}
                          {hasTicket && (
                            <p className="mono-text text-xs text-[#E49B3A] mt-3">{reg.registration_code}</p>
                          )}
                          {reg.status === 'approved' && (() => {
                            const checkIn = getCheckInWindow(event);
                            if (!checkIn.canCheckIn) {
                              return (
                                <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                                  <p className="text-[11px] font-bold text-amber-200">
                                    {checkIn.phase === 'not_open' ? 'Check-in not open yet' : 'Check-in closed'}
                                  </p>
                                  <p className="mt-1 text-[11px] leading-4 text-white/50">{checkIn.message}</p>
                                  <p className="mt-1 text-[10px] text-white/35">
                                    You can connect your wallet anytime; Cardano check-in only works during the window above.
                                  </p>
                                </div>
                              );
                            }
                            return (
                              <div className="mt-3 space-y-2">
                                <p className="text-[11px] text-emerald-300/90">{checkIn.message}</p>
                                <button
                                  type="button"
                                  disabled={busyId === reg.id || !connected}
                                  onClick={() => void selfCheckIn(reg)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-[#52670F] px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
                                >
                                  {busyId === reg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Blocks className="w-3 h-3" />}
                                  {connected ? 'Check in on Cardano' : 'Connect wallet, then check in'}
                                </button>
                              </div>
                            );
                          })()}
                          {reg.status === 'attended' && (
                            <>
                              {(() => {
                                const att = store.getAttendanceByRegistration(reg.id);
                                return att?.tx_hash ? (
                                  <a
                                    href={att.explorer_url || explorerTxUrl(att.tx_hash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#E49B3A]"
                                  >
                                    On-chain {truncateMiddle(att.tx_hash)} <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : null;
                              })()}
                              <Link to={`/proof/participant/${reg.id}`} className="workspace-chip mt-3 inline-flex">
                                <Shield className="w-3 h-3" /> View Proof Engine record
                              </Link>
                            </>
                          )}
                        </div>

                        {hasTicket ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-lg self-start">
                            <QRCodeSVG value={reg.registration_code || ''} size={100} bgColor="#ffffff" fgColor="#030303" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:w-[116px] flex items-center justify-center">
                            <p className="text-[10px] text-center text-white/25">No QR until approved</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
