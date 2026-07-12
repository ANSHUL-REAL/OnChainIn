import { Link } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CertificateDownloadButton } from '@/components/CertificateDownloadButton'
import store from '@/data/store'
import { Award, Blocks, CheckCircle, Calendar, ExternalLink, Shield } from 'lucide-react'
import type { Certificate } from '@/types'
import { explorerTxUrl, truncateMiddle } from '@/lib/cardano'
import { WinnerSelfieCard } from '@/components/WinnerSelfieCard'

export default function ParticipantCertificates() {
  const user = store.getCurrentUser()
  const certificates = user ? store.getUserCertificates(user.id) : []

  const resolveTx = (cert: Certificate) => {
    if (cert.tx_hash) {
      return {
        txHash: cert.tx_hash,
        explorerUrl: cert.explorer_url || explorerTxUrl(cert.tx_hash),
        walletAddress: cert.wallet_address,
      }
    }
    const att = store.getAttendance().find(
      (a) => a.event_id === cert.event_id && a.participant_id === cert.user_id && a.tx_hash,
    )
    if (!att?.tx_hash) return {}
    return {
      txHash: att.tx_hash,
      explorerUrl: att.explorer_url || explorerTxUrl(att.tx_hash),
      walletAddress: att.wallet_address,
    }
  }

  return (
    <DashboardLayout title="My Certificates">
      {certificates.length === 0 ? (
        <div className="glass-card rounded-2xl border border-[#E7E1D2] bg-white p-10 text-center shadow-sm">
          <Award className="mx-auto mb-3 h-12 w-12 text-[#192837]/15" />
          <p className="text-sm text-[#5E6256]">
            No certificates yet. Certificates unlock after you’re checked in at an event and the
            organizer issues them.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {certificates.map((cert) => {
            const chain = resolveTx(cert)
            const event = cert.event || store.getEventById(cert.event_id)
            const organizerName = event
              ? store.getProfileById(event.organizer_id)?.full_name || 'OnChainIn'
              : 'OnChainIn'
            return (
              <div key={cert.id} className="space-y-3">
                <div className="glass-card flex items-center gap-4 rounded-xl border border-[#E7E1D2] bg-white p-4 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <Award className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-[#192837]">
                      {event?.title || cert.event?.title || 'Event'}
                    </h3>
                    <p className="text-xs text-[#5E6256]">{cert.role}</p>
                    <p className="mono-text mt-0.5 truncate text-[11px] text-amber-800">
                      {cert.certificate_code}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-[#5E6256]">
                        <Calendar className="h-3 w-3" />
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Verified
                      </span>
                      {chain.txHash && (
                        <span className="mono-text inline-flex items-center gap-1 text-[#52670F]">
                          <Blocks className="h-3 w-3" /> {truncateMiddle(chain.txHash)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                    <Link
                      to={`/verify/certificate/${cert.certificate_code}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Shield className="h-3 w-3" /> Verify
                    </Link>
                    {chain.explorerUrl && (
                      <a
                        href={chain.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-[#F2F2EE] px-3 py-1.5 text-[11px] font-semibold text-[#5E6256] transition hover:bg-[#E8E6DF]"
                      >
                        <ExternalLink className="h-3 w-3" /> Explorer
                      </a>
                    )}
                    <CertificateDownloadButton
                      data={{
                        participantName: user?.full_name || 'Participant',
                        eventName: event?.title || 'Event',
                        date: event?.date || new Date(cert.issued_at).toLocaleDateString(),
                        organizerName,
                        code: cert.certificate_code,
                        role: cert.role,
                        txHash: chain.txHash,
                        explorerUrl: chain.explorerUrl,
                        walletAddress: chain.walletAddress,
                      }}
                    />
                  </div>
                </div>
                {event && user && (
                  <WinnerSelfieCard
                    event={event}
                    userId={user.id}
                    walletAddress={chain.walletAddress || user.cardano_address}
                    highlightLabel={cert.role || 'Winner'}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
