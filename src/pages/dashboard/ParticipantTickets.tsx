import { useState } from 'react'
import { Link } from 'react-router'
import { CardanoWallet, useWallet } from '@meshsdk/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { MobileWalletPanel, isMobileDevice } from '@/components/MobileWalletPanel'
import { WinnerSelfieCard } from '@/components/WinnerSelfieCard'
import store from '@/data/store'
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Blocks,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { explorerTxUrl, submitOnChainProof, truncateMiddle } from '@/lib/cardano'
import { getCheckInWindow } from '@/lib/eventLifecycle'
import type { Registration } from '@/types'

const statusOrder: Registration['status'][] = ['pending', 'approved', 'rejected', 'attended', 'cancelled']

const statusLabels: Record<Registration['status'], string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  attended: 'Attended',
  cancelled: 'Cancelled',
}

function statusClasses(status: Registration['status']) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800'
  if (status === 'approved') return 'bg-sky-100 text-sky-800'
  if (status === 'attended') return 'bg-emerald-100 text-emerald-800'
  if (status === 'rejected') return 'bg-red-100 text-red-700'
  return 'bg-[#F2F2EE] text-[#5E6256]'
}

export default function ParticipantTickets() {
  const user = store.getCurrentUser()
  const { connected, wallet } = useWallet()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  void version
  const registrations = user ? store.getParticipantRegistrations(user.id) : []
  const events = store.getEvents()
  const mobile = isMobileDevice()

  const selfCheckIn = async (reg: Registration) => {
    if (!connected || !wallet) {
      setError(
        mobile
          ? 'On phone: open this site inside Vespr/Eternl browser (see Mobile wallet panel), then connect. Or use the ticket QR at the desk.'
          : 'Connect a Cardano Preprod wallet first (Lace extension on desktop).',
      )
      return
    }
    const event = events.find((e) => e.id === reg.event_id)
    if (!event) return

    const window = getCheckInWindow(event)
    if (!window.canCheckIn) {
      setError(window.message)
      return
    }
    if (reg.status !== 'approved') {
      setError('Only approved tickets can check in. Wait for organizer approval.')
      return
    }

    setBusyId(reg.id)
    setError('')
    try {
      const result = await submitOnChainProof(wallet, {
        kind: 'attendance',
        eventId: event.id,
        eventTitle: event.title,
        registrationCode: reg.registration_code || '',
        role: 'participant',
        participantId: reg.participant_id,
        location: event.city || event.venue || '',
      })
      store.checkInRegistration(reg, {
        method: 'cardano',
        txHash: result.txHash,
        walletAddress: result.walletAddress,
        explorerUrl: explorerTxUrl(result.txHash),
      })
      if (user) store.updateProfile(user.id, { cardano_address: result.walletAddress })
      setVersion((v) => v + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardLayout title="My Tickets">
      <div className="mb-5 rounded-2xl border border-[#DCE8BE] bg-[#F6FAE8] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#52670F]">
            Cardano self check-in
          </p>
          <p className="mt-1 text-sm text-[#5E6256]">
            <strong>Approval ≠ check-in.</strong> After approval, check-in unlocks on event day. Desktop:
            connect Lace. Phone: use the mobile panel below (QR faucet + address + wallet browser).
          </p>
        </div>
        {!mobile && <CardanoWallet label="Connect Wallet" persist isDark={false} />}
      </div>

      <div className="mb-6">
        <MobileWalletPanel />
      </div>

      {mobile && (
        <div className="mb-5 rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] p-4">
          <p className="text-xs font-bold text-[#7C3AED]">Phone users</p>
          <p className="mt-1 text-sm text-[#5E6256]">
            Extension wallets won’t appear in Safari/Chrome. Open OnChainIn inside Vespr or Eternl,
            or show your <strong>ticket QR</strong> at the organizer desk for QR check-in.
          </p>
          <div className="mt-3">
            <CardanoWallet label="Connect (wallet browser only)" persist isDark={false} />
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {registrations.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center shadow-sm">
          <Ticket className="mx-auto mb-3 h-12 w-12 text-[#192837]/15" />
          <p className="text-sm text-[#5E6256]">No registrations yet. Browse events to apply!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map((status) => {
            const group = registrations.filter((registration) => registration.status === status)
            if (group.length === 0) return null

            return (
              <section key={status}>
                <h2 className="mb-3 text-sm font-bold text-[#192837]">{statusLabels[status]}</h2>
                <div className="grid gap-4">
                  {group.map((reg) => {
                    const event = events.find((e) => e.id === reg.event_id)
                    if (!event) return null
                    const hasTicket =
                      (reg.status === 'approved' || reg.status === 'attended') &&
                      Boolean(reg.registration_code)
                    const att = store.getAttendanceByRegistration(reg.id)

                    return (
                      <div
                        key={reg.id}
                        className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm sm:flex-row"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 text-base font-bold text-[#192837]">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#5E6256]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {event.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.venue}, {event.city}
                            </span>
                          </div>

                          <span
                            className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClasses(reg.status)}`}
                          >
                            {reg.status === 'pending' && <Clock className="h-3 w-3" />}
                            {(reg.status === 'approved' || reg.status === 'attended') && (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {reg.status === 'rejected' && <XCircle className="h-3 w-3" />}
                            {statusLabels[reg.status]}
                          </span>

                          {reg.status === 'pending' && (
                            <p className="mt-3 text-xs text-[#5E6256]">
                              Waiting for organizer approval. QR ticket appears after approval.
                            </p>
                          )}
                          {reg.status === 'rejected' && (
                            <p className="mt-3 text-xs text-red-600">
                              {reg.rejection_reason || 'This registration was rejected.'}
                            </p>
                          )}
                          {reg.status === 'attended' && (
                            <p className="mt-3 text-xs text-emerald-700">
                              Attendance verified. You can claim a winner spotlight selfie below if
                              you placed / won.
                            </p>
                          )}
                          {hasTicket && (
                            <p className="mono-text mt-3 text-xs font-semibold text-amber-800">
                              {reg.registration_code}
                            </p>
                          )}
                          {reg.status === 'approved' &&
                            (() => {
                              const checkIn = getCheckInWindow(event)
                              if (!checkIn.canCheckIn) {
                                return (
                                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                    <p className="text-[11px] font-bold text-amber-900">
                                      {checkIn.phase === 'not_open'
                                        ? 'Check-in not open yet'
                                        : 'Check-in closed'}
                                    </p>
                                    <p className="mt-1 text-[11px] leading-4 text-[#5E6256]">
                                      {checkIn.message}
                                    </p>
                                  </div>
                                )
                              }
                              return (
                                <div className="mt-3 space-y-2">
                                  <p className="text-[11px] text-emerald-700">{checkIn.message}</p>
                                  <button
                                    type="button"
                                    disabled={busyId === reg.id || !connected}
                                    onClick={() => void selfCheckIn(reg)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-[#7C3AED] px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
                                  >
                                    {busyId === reg.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Blocks className="h-3 w-3" />
                                    )}
                                    {connected
                                      ? 'Check in on Cardano'
                                      : 'Connect wallet, then check in'}
                                  </button>
                                  {!connected && (
                                    <p className="text-[10px] text-[#5E6256]">
                                      Or show the ticket QR to the desk for QR check-in.
                                    </p>
                                  )}
                                </div>
                              )
                            })()}
                          {reg.status === 'attended' && (
                            <>
                              {att?.tx_hash ? (
                                <a
                                  href={att.explorer_url || explorerTxUrl(att.tx_hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-800"
                                >
                                  On-chain {truncateMiddle(att.tx_hash)}{' '}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null}
                              <Link
                                to={`/proof/participant/${reg.id}`}
                                className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#E7E1D2] bg-[#F6F2EB] px-3 py-1.5 text-[11px] font-bold text-[#192837]"
                              >
                                <Shield className="h-3 w-3" /> View proof record
                              </Link>
                              <div className="mt-4">
                                <WinnerSelfieCard
                                  event={event}
                                  userId={reg.participant_id}
                                  walletAddress={
                                    att?.wallet_address || user?.cardano_address || undefined
                                  }
                                  highlightLabel="Winner"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {hasTicket ? (
                          <div className="flex shrink-0 flex-col items-center gap-1 self-start rounded-xl border border-[#E7E1D2] bg-white p-2">
                            <QRCodeSVG
                              value={reg.registration_code || ''}
                              size={100}
                              bgColor="#ffffff"
                              fgColor="#030303"
                            />
                            <p className="text-[9px] font-semibold text-[#5E6256]">Desk / QR check-in</p>
                          </div>
                        ) : (
                          <div className="flex h-[116px] w-[116px] shrink-0 items-center justify-center rounded-xl border border-dashed border-[#D9D0B8] bg-[#F9F8F1]">
                            <p className="px-2 text-center text-[10px] text-[#9AA08D]">
                              No QR until approved
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
