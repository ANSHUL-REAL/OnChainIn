import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import store from '@/data/store'
import { downloadCertificate } from '@/lib/certificate'
import { Award, Blocks, CheckCircle, Download, ExternalLink, Loader2 } from 'lucide-react'
import { truncateMiddle } from '@/lib/cardano'

export default function EventCertificates() {
  const { id } = useParams<{ id: string }>()
  const event = store.getEventById(id || '')
  const [, setVersion] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  if (!event) {
    return (
      <DashboardLayout title="Certificates">
        <p className="text-white/50">Event not found</p>
      </DashboardLayout>
    )
  }

  const organizerName =
    store.getProfileById(event.organizer_id)?.full_name ||
    store.getCurrentUser()?.full_name ||
    'OnChainIn'
  const registrations = store.getEventRegistrations(event.id)
  // Only checked-in (attended) participants are certificate-eligible.
  const attended = registrations.filter((r) => r.status === 'attended')
  const existingCerts = store.getEventCertificates(event.id)
  const certByUser = new Map(existingCerts.map((c) => [c.user_id, c]))

  const issue = (participantId: string, participantName: string) => {
    setError('')
    const cert = store.issueCertificate({
      event,
      userId: participantId,
      userName: participantName,
      role: 'Participant',
      organizerName,
    })
    store.createPassportRecord({
      user_id: participantId,
      event_id: event.id,
      record_type: 'certificate',
      title: `${event.title} Certificate`,
      description: 'Certificate of Participation',
      skills: [event.category],
      hours: 0,
      certificate_id: cert.certificate_code,
      verified_at: new Date().toISOString(),
    })
    setVersion((v) => v + 1)
  }

  const download = async (participantName: string, code: string, participantId: string) => {
    setError('')
    setBusy(code)
    try {
      const cert = store.getCertificateByCode(code)
      const att = store.getAttendance().find(
        (a) => a.event_id === event.id && a.participant_id === participantId && a.tx_hash,
      )
      await downloadCertificate({
        participantName,
        eventName: event.title,
        date: event.date,
        organizerName,
        code,
        role: 'Participant',
        txHash: cert?.tx_hash || att?.tx_hash,
        explorerUrl: cert?.explorer_url || att?.explorer_url,
        walletAddress: cert?.wallet_address || att?.wallet_address,
      })
    } catch {
      setError('Could not generate the certificate. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardLayout title="Certificates">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{event.title}</p>
          <p className="mt-1 text-sm text-white/50">
            {attended.length} checked-in · certificate eligible · {existingCerts.length} issued
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {attended.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Award className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="text-sm text-white/55">
            No checked-in participants yet. Check people in from the Check-In page first — only
            checked-in attendees can receive certificates.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {attended.map((reg) => {
            const cert = certByUser.get(reg.participant_id)
            const name = reg.participant?.full_name || 'Participant'
            const att = store.getAttendanceByRegistration(reg.id)
            const txHash = cert?.tx_hash || att?.tx_hash
            return (
              <div
                key={reg.id}
                className="glass-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-bold text-cyan-300">
                  {name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{name}</p>
                  <p className="mono-text mt-0.5 text-[11px] text-white/45">
                    {cert?.certificate_code || reg.registration_code}
                  </p>
                  {txHash ? (
                    <p className="mono-text mt-1.5 flex items-center gap-1 text-[11px] text-emerald-300">
                      <Blocks className="h-3 w-3" /> Cardano {truncateMiddle(txHash)}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-white/40">No on-chain tx (manual/QR check-in)</p>
                  )}
                </div>
                {cert ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="hidden items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 sm:inline-flex">
                      <CheckCircle className="h-3 w-3" /> Issued
                    </span>
                    <button
                      type="button"
                      onClick={() => void download(name, cert.certificate_code, reg.participant_id)}
                      disabled={busy === cert.certificate_code}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-400/15 px-3 py-1.5 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/25 disabled:opacity-50"
                    >
                      {busy === cert.certificate_code ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}{' '}
                      Download
                    </button>
                    <Link
                      to={`/verify/certificate/${cert.certificate_code}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                    >
                      Verify
                    </Link>
                    {txHash && cert.explorer_url && (
                      <a
                        href={cert.explorer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        Explorer <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => issue(reg.participant_id, name)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-400/25"
                  >
                    <Award className="h-3.5 w-3.5" /> Generate{txHash ? ' + bind tx' : ''}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
