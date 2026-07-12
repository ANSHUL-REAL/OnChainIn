import { useState } from 'react'
import { Link } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import store from '@/data/store'
import { downloadCertificate } from '@/lib/certificate'
import { Award, Blocks, Download, CheckCircle, Calendar, ExternalLink, Loader2, Shield } from 'lucide-react'
import type { Certificate } from '@/types'
import { explorerTxUrl, truncateMiddle } from '@/lib/cardano'
import { WinnerSelfieCard } from '@/components/WinnerSelfieCard'

export default function ParticipantCertificates() {
  const user = store.getCurrentUser()
  const certificates = user ? store.getUserCertificates(user.id) : []
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

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

  const download = async (cert: Certificate) => {
    setError('')
    setBusy(cert.id)
    try {
      const event = cert.event || store.getEventById(cert.event_id)
      const organizerName = event
        ? store.getProfileById(event.organizer_id)?.full_name || 'OnChainIn'
        : 'OnChainIn'
      const chain = resolveTx(cert)
      await downloadCertificate({
        participantName: user?.full_name || 'Participant',
        eventName: event?.title || 'Event',
        date: event?.date || new Date(cert.issued_at).toLocaleDateString(),
        organizerName,
        code: cert.certificate_code,
        role: cert.role,
        txHash: chain.txHash,
        explorerUrl: chain.explorerUrl,
        walletAddress: chain.walletAddress,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Could not generate the certificate. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardLayout title="My Certificates">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
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
            return (
              <div key={cert.id} className="space-y-3">
                <div className="glass-card flex items-center gap-4 rounded-xl border border-[#E7E1D2] bg-white p-4 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <Award className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-[#192837]">{cert.event?.title}</h3>
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
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
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
                    <button
                      type="button"
                      onClick={() => void download(cert)}
                      disabled={busy === cert.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                    >
                      {busy === cert.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}{' '}
                      Download
                    </button>
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
