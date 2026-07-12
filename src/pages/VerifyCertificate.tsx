import { Link, useParams } from 'react-router'
import {
  Award,
  Blocks,
  Building2,
  Calendar,
  CheckCircle,
  ExternalLink,
  User,
  XCircle,
} from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { CertificateDownloadButton } from '@/components/CertificateDownloadButton'
import store from '@/data/store'
import { explorerTxUrl, truncateMiddle } from '@/lib/cardano'
import { isFreeEvent } from '@/lib/eventLifecycle'
import { ChainTxStatus } from '@/components/ChainTxStatus'

export default function VerifyCertificate() {
  const params = useParams<{ certificateId?: string; id?: string }>()
  const certificateId = params.certificateId || params.id || ''
  const cert = store.getCertificateByCode(certificateId)
  const event = cert ? store.getEventById(cert.event_id) : null
  const user = cert ? store.getProfileById(cert.user_id) : null
  const organizer = event ? store.getProfileById(event.organizer_id) : null

  // Fallback: if cert was issued before tx fields existed, try attendance
  const attendance =
    cert &&
    store.getAttendance().find(
      (a) => a.event_id === cert.event_id && a.participant_id === cert.user_id && a.tx_hash,
    )
  const txHash = cert?.tx_hash || attendance?.tx_hash
  const explorerUrl = cert?.explorer_url || (txHash ? explorerTxUrl(txHash) : undefined)
  const walletAddress = cert?.wallet_address || attendance?.wallet_address

  return (
    <div className="eventos-light-app min-h-screen bg-[#F7F6EB] text-[#14150F]">
      <Navbar />
      <main className="max-w-[76rem] mx-auto px-4 sm:px-6 pt-24 pb-16">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
          {/* Certificate document preview */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#DCE8BE] bg-[#FBF9F3] shadow-[0_28px_80px_rgba(82,103,15,0.12)]">
            {/* decorative corners */}
            <div className="pointer-events-none absolute inset-4 rounded-[1.25rem] border border-[#C9D4A8]/80" />
            <div className="pointer-events-none absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 border-[#52670F]/40" />
            <div className="pointer-events-none absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 border-[#52670F]/40" />
            <div className="pointer-events-none absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-[#52670F]/40" />
            <div className="pointer-events-none absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-[#52670F]/40" />

            <div className="relative px-6 py-10 sm:px-12 sm:py-12 text-center">
              {/* Brand mark */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-transparent">
                <img
                  src="/logo.png"
                  alt="OnChainIn"
                  className="h-12 w-12 object-contain bg-transparent"
                  draggable={false}
                />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6A7D1A]">
                OnChainIn
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9AA08D]">
                {txHash
                  ? 'Cardano-verified attendance'
                  : isFreeEvent(event)
                    ? 'Free event · not blockchain-verified'
                    : 'Official event credential'}
              </p>

              <h1 className="mt-6 font-serif text-2xl font-bold tracking-tight text-[#14150F] sm:text-3xl">
                Certificate of Achievement
              </h1>

              {cert ? (
                <>
                  <p className="mt-6 text-sm text-[#5E6256]">
                    This certificate is proudly presented to
                  </p>
                  <p className="mt-3 font-serif text-3xl font-bold text-[#52670F] sm:text-4xl">
                    {user?.full_name || 'Participant'}
                  </p>
                  <div className="mx-auto mt-4 h-px w-40 bg-[#C9D4A8]" />

                  <p className="mt-5 text-sm text-[#5E6256]">
                    for {cert.role || 'participation'} in
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#14150F] sm:text-2xl">
                    {event?.title || 'Event'}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#5E6256]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#52670F]" />
                      {event?.date || new Date(cert.issued_at).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#52670F]" />
                      {organizer?.full_name || 'OnChainIn'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-[#52670F]" />
                      {cert.role}
                    </span>
                  </div>

                  {/* Cardano strip */}
                  <div
                    className={`mt-8 rounded-2xl border px-4 py-4 text-left ${
                      txHash
                        ? 'border-emerald-200 bg-emerald-50/90'
                        : 'border-[#DCE8BE] bg-white/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Blocks
                        className={`mt-0.5 h-5 w-5 shrink-0 ${
                          txHash ? 'text-emerald-700' : 'text-[#5E6256]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#52670F]">
                          {isFreeEvent(event) ? 'Verification status' : 'Cardano attendance proof'}
                        </p>
                        {isFreeEvent(event) ? (
                          <p className="mt-1.5 text-sm text-[#5E6256]">
                            This certificate is from a <strong>Free event</strong>. It is recorded in
                            OnChainIn only — there is no Cardano transaction to audit on an explorer.
                          </p>
                        ) : txHash ? (
                          <>
                            <p className="mt-1.5 text-sm font-semibold text-[#14150F]">
                              Attendance tx bound to this certificate
                            </p>
                            <p className="mt-1.5 break-all font-mono text-[11px] text-[#52670F]">
                              {txHash}
                            </p>
                            {walletAddress && (
                              <p className="mt-1 break-all font-mono text-[10px] text-[#5E6256]">
                                Wallet: {walletAddress}
                              </p>
                            )}
                            <div className="mt-3">
                              <ChainTxStatus txHash={txHash} />
                            </div>
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#52670F] px-3.5 py-1.5 text-[11px] font-black text-white"
                            >
                              View on explorer
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <p className="mt-2 text-[10px] text-[#5E6256]">
                              Ref: {truncateMiddle(txHash, 12, 12)} · Preprod Cardano · live check via Blockfrost
                            </p>
                          </>
                        ) : (
                          <p className="mt-1.5 text-sm text-[#5E6256]">
                            Valid in OnChainIn. No Cardano tx bound (check-in may have been QR/manual
                            only).
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col items-center gap-1 border-t border-[#DCE8BE]/80 pt-6">
                    <p className="font-mono text-xs font-semibold text-[#52670F]">
                      {cert.certificate_code}
                    </p>
                    <p className="text-[11px] text-[#9AA08D]">Certificate ID · scan or share to verify</p>
                  </div>

                  {cert && event && (
                    <div className="mt-6">
                      <CertificateDownloadButton
                        label="Download certificate"
                        className="gold-btn inline-flex items-center gap-2"
                        data={{
                          participantName: user?.full_name || 'Participant',
                          eventName: event.title,
                          date: event.date,
                          organizerName: organizer?.full_name || 'OnChainIn',
                          code: cert.certificate_code,
                          role: cert.role,
                          txHash,
                          explorerUrl,
                          walletAddress,
                        }}
                      />
                    </div>
                  )}
                  {txHash && (
                    <p className="mt-2 text-[11px] text-[#9AA08D]">
                      Full Cardano tx hash is shown above for verification. The PNG keeps only a tiny
                      border reference — scan the QR to open this page.
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-10">
                  <XCircle className="mx-auto h-12 w-12 text-[#A4442A]/45" />
                  <p className="mt-4 text-sm font-semibold text-[#5E6256]">
                    This ID does not match any certificate issued by OnChainIn.
                  </p>
                  <div className="mt-4 rounded-2xl border border-[#DCE8BE] bg-white/70 p-4 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#52670F]">
                      Verification ID
                    </p>
                    <p className="mono-text mt-2 break-all text-sm font-black text-[#14150F]">
                      {certificateId || 'No certificate ID provided'}
                    </p>
                  </div>
                  <Link to="/events" className="gold-btn mt-6 inline-flex">
                    Explore events
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Side panel */}
          <aside className="passport-verify">
            <div className="passport-seal">
              <img src="/logo.png" alt="OnChainIn" className="h-11 w-11 object-contain bg-transparent" />
              <span>{cert ? 'Valid' : 'Check'}</span>
            </div>
            <p className="passport-kicker">Verified by OnChainIn</p>
            <h2>{cert ? 'Authentic event credential.' : 'No valid match yet.'}</h2>
            <p>
              A valid certificate links a participant, event, and optional Cardano attendance tx for
              public audit.
            </p>

            {cert && (
              <div className="mt-6 grid gap-3">
                {[
                  { icon: User, label: 'Issued to', value: user?.full_name || 'Unknown' },
                  { icon: Building2, label: 'Event', value: event?.title || 'Unknown' },
                  {
                    icon: Calendar,
                    label: 'Issued',
                    value: new Date(cert.issued_at).toLocaleDateString(),
                  },
                  { icon: Award, label: 'Role', value: cert.role },
                ].map((item) => (
                  <div key={item.label} className="passport-rule">
                    <item.icon className="h-5 w-5" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-[#5E6256]">
                        {item.label}
                      </p>
                      <p className="mt-0.5 font-black text-[#14150F]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <div className="passport-rule">
                <CheckCircle className="h-5 w-5" /> Certificate record: {cert ? 'Found' : 'Missing'}
              </div>
              <div className="passport-rule">
                <CheckCircle className="h-5 w-5" /> Event record: {event ? 'Found' : 'Missing'}
              </div>
              <div className="passport-rule">
                <Blocks className="h-5 w-5" /> Cardano tx: {txHash ? 'Bound' : 'Not bound'}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}
