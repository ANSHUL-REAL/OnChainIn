import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CertificateDownloadButton } from '@/components/CertificateDownloadButton'
import store from '@/data/store'
import { Award, Blocks, CheckCircle, Calendar, ExternalLink, Shield, Ticket } from 'lucide-react'
import type { Certificate } from '@/types'
import { explorerTxUrl, truncateMiddle } from '@/lib/cardano'
import { WinnerSelfieCard } from '@/components/WinnerSelfieCard'

export default function ParticipantCertificates() {
  const user = store.getCurrentUser()
  const [tick, setTick] = useState(0)

  // Re-read store when tab focuses or cloud hydrates (multi-device / multi-user)
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    const t = window.setInterval(refresh, 4000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
      window.clearInterval(t)
    }
  }, [])

  // Backfill: if participant already checked in but has no certificate yet, issue one now
  useEffect(() => {
    if (!user) return
    const attended = store.getParticipantRegistrations(user.id).filter((r) => r.status === 'attended')
    let created = 0
    for (const reg of attended) {
      const existing = store.getUserCertificates(user.id).some((c) => c.event_id === reg.event_id)
      if (existing) continue
      const event = store.getEventById(reg.event_id)
      if (!event) continue
      try {
        const cert = store.issueCertificate({
          event,
          userId: reg.participant_id || user.id,
          userName: user.full_name || 'Participant',
          role: 'Participant',
          organizerName: store.getProfileById(event.organizer_id)?.full_name || 'OnChainIn',
        })
        store.createPassportRecord({
          user_id: reg.participant_id || user.id,
          event_id: event.id,
          record_type: 'certificate',
          title: `${event.title} Certificate`,
          description: 'Certificate of Participation',
          skills: event.category ? [event.category] : [],
          hours: 0,
          certificate_id: cert.certificate_code,
          verified_at: new Date().toISOString(),
        })
        created += 1
      } catch {
        /* ignore */
      }
    }
    if (created > 0) setTick((t) => t + 1)
  }, [user?.id])

  void tick
  const certificates = user ? store.getUserCertificates(user.id) : []

  // Also surface certs for events this user attended (if user_id mismatched slightly)
  const attendedRegs = user
    ? store.getParticipantRegistrations(user.id).filter((r) => r.status === 'attended')
    : []
  const extraFromAttendance: Certificate[] = []
  if (user) {
    for (const reg of attendedRegs) {
      const has = certificates.some((c) => c.event_id === reg.event_id)
      if (has) continue
      const all = store.getEventCertificates(reg.event_id)
      const match = all.find((c) => c.user_id === reg.participant_id || c.user_id === user.id)
      if (match && !certificates.some((c) => c.id === match.id)) {
        extraFromAttendance.push({
          ...match,
          event: store.getEventById(match.event_id),
        })
      }
    }
  }
  const list = [...certificates, ...extraFromAttendance]

  const resolveTx = (cert: Certificate) => {
    if (cert.tx_hash) {
      return {
        txHash: cert.tx_hash,
        explorerUrl: cert.explorer_url || explorerTxUrl(cert.tx_hash),
        walletAddress: cert.wallet_address,
      }
    }
    const att = store.getAttendance().find(
      (a) =>
        a.event_id === cert.event_id &&
        (a.participant_id === cert.user_id || a.participant_id === user?.id) &&
        a.tx_hash,
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
      <div className="mb-4 rounded-2xl border border-[#DCE8BE] bg-[#F6FAE8] px-4 py-3 text-sm text-[#5E6256]">
        After check-in, a certificate is created automatically. Tap{' '}
        <strong className="text-[#52670F]">Download certificate</strong> — a preview opens with{' '}
        <strong className="text-[#52670F]">Save PNG to device</strong> if your browser blocks the
        file.
      </div>

      {list.length === 0 ? (
        <div className="glass-card rounded-2xl border border-[#E7E1D2] bg-white p-10 text-center shadow-sm">
          <Award className="mx-auto mb-3 h-12 w-12 text-[#192837]/15" />
          <p className="text-sm font-semibold text-[#192837]">No certificates yet</p>
          <p className="mt-2 text-sm text-[#5E6256]">
            Check in on an approved ticket first. Certificates appear here right after check-in (or
            when the organizer issues them).
          </p>
          <Link
            to="/dashboard/participant/tickets"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#52670F] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3f5010]"
          >
            <Ticket className="h-4 w-4" />
            Go to My Tickets
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((cert) => {
            const chain = resolveTx(cert)
            const event = cert.event || store.getEventById(cert.event_id)
            const organizerName = event
              ? store.getProfileById(event.organizer_id)?.full_name || 'OnChainIn'
              : 'OnChainIn'
            return (
              <div key={cert.id} className="space-y-3">
                <div className="glass-card rounded-xl border border-[#E7E1D2] bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                      <Award className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#192837]">
                        {event?.title || cert.event?.title || 'Event'}
                      </h3>
                      <p className="text-xs text-[#5E6256]">{cert.role || 'Participant'}</p>
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
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-[#F0EBE0] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                    <CertificateDownloadButton
                      variant="primary"
                      label="Download certificate"
                      data={{
                        participantName: user?.full_name || 'Participant',
                        eventName: event?.title || 'Event',
                        date: event?.date || new Date(cert.issued_at).toLocaleDateString(),
                        organizerName,
                        code: cert.certificate_code,
                        role: cert.role || 'Participant',
                        txHash: chain.txHash,
                        explorerUrl: chain.explorerUrl,
                        walletAddress: chain.walletAddress,
                      }}
                    />
                    <Link
                      to={`/verify/certificate/${cert.certificate_code}`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <Shield className="h-4 w-4" /> Verify online
                    </Link>
                    {chain.explorerUrl && (
                      <a
                        href={chain.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#E7E1D2] bg-[#F2F2EE] px-4 py-3 text-sm font-semibold text-[#5E6256] transition hover:bg-[#E8E6DF]"
                      >
                        <ExternalLink className="h-4 w-4" /> Explorer
                      </a>
                    )}
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
