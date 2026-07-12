import { useState } from 'react'
import { Link } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import store from '@/data/store'
import { downloadCertificate } from '@/lib/certificate'
import { Award, Blocks, Download, CheckCircle, Calendar, ExternalLink, Loader2, Shield } from 'lucide-react'
import type { Certificate } from '@/types'
import { explorerTxUrl, truncateMiddle } from '@/lib/cardano'

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
    } catch {
      setError('Could not generate the certificate. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardLayout title="My Certificates">
      {error && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {certificates.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Award className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="text-sm text-white/55">
            No certificates yet. Certificates unlock after you’re checked in at an event and the
            organizer issues them.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {certificates.map((cert) => {
            const chain = resolveTx(cert)
            return (
              <div key={cert.id} className="glass-card flex items-center gap-4 rounded-xl p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Award className="h-6 w-6 text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">{cert.event?.title}</h3>
                  <p className="text-xs text-white/50">{cert.role}</p>
                  <p className="mono-text mt-0.5 truncate text-[11px] text-amber-300/90">
                    {cert.certificate_code}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-white/45">
                      <Calendar className="h-3 w-3" />
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </span>
                    {chain.txHash && (
                      <span className="mono-text inline-flex items-center gap-1 text-cyan-300">
                        <Blocks className="h-3 w-3" /> {truncateMiddle(chain.txHash)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Link
                    to={`/verify/certificate/${cert.certificate_code}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                  >
                    <Shield className="h-3 w-3" /> Verify
                  </Link>
                  {chain.explorerUrl && (
                    <a
                      href={chain.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" /> Explorer
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void download(cert)}
                    disabled={busy === cert.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-400/15 px-3 py-1.5 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/25 disabled:opacity-50"
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
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
