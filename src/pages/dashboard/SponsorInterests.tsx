import { useState } from 'react'
import { Link } from 'react-router'
import { Calendar, Gift, Handshake, ExternalLink } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CardanoAdaPay } from '@/components/CardanoAdaPay'
import store from '@/data/store'
import { explorerTxUrl, formatAda, truncateMiddle } from '@/lib/cardano'

export default function SponsorInterests() {
  const user = store.getCurrentUser()
  const interests = user ? store.getSponsorInterestsBySponsor(user.id) : []
  const [, setVersion] = useState(0)
  const [adaById, setAdaById] = useState<Record<string, string>>({})

  return (
    <DashboardLayout title="My Sponsor Interests">
      {interests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center shadow-sm">
          <Handshake className="mx-auto mb-3 h-12 w-12 text-[#7C3AED]/35" />
          <p className="mb-4 text-sm font-semibold text-[#5E6256]">No sponsor interests submitted yet.</p>
          <Link to="/dashboard/sponsor/events" className="gold-btn inline-flex text-sm">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {interests.map((interest) => {
            const event = interest.event || store.getEventById(interest.event_id)
            const organizerAddr = store.getOrganizerCardanoAddress(interest.event_id)
            const pkgAda = interest.package?.amount
            const defaultAda = interest.ada_amount || pkgAda || 5
            const adaInput = adaById[interest.id] ?? String(defaultAda)
            const canPay =
              (interest.status === 'confirmed' || interest.status === 'contacted') &&
              !interest.tx_hash &&
              Boolean(organizerAddr)

            return (
              <div key={interest.id} className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF]">
                    <Gift className="h-5 w-5 text-[#7C3AED]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-base font-bold text-[#192837]">
                        {event?.title || 'Sponsor interest'}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold capitalize ${
                          interest.tx_hash || interest.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : interest.status === 'rejected'
                              ? 'bg-red-50 text-red-600'
                              : interest.status === 'contacted'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {interest.tx_hash ? 'paid on Cardano' : interest.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#7C3AED]">
                      {interest.sponsorship_type || interest.package?.title || 'General sponsorship'}
                    </p>
                    {interest.contribution_details && (
                      <p className="mt-2 text-sm leading-6 text-[#5E6256]">{interest.contribution_details}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#5E6256]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(interest.created_at).toLocaleDateString()}
                      </span>
                      {organizerAddr && (
                        <span className="font-mono text-[10px]">
                          Organizer wallet: {truncateMiddle(organizerAddr, 12, 10)}
                        </span>
                      )}
                    </div>

                    {interest.tx_hash && (
                      <a
                        href={interest.explorer_url || explorerTxUrl(interest.tx_hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"
                      >
                        Paid {formatAda(interest.ada_amount || 0)} · view tx <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {canPay && (
                      <div className="mt-4 space-y-2">
                        <label className="block text-xs font-semibold text-[#5E6256]">
                          ADA amount to send
                        </label>
                        <input
                          type="number"
                          min={1}
                          step="0.1"
                          value={adaInput}
                          onChange={(e) =>
                            setAdaById((prev) => ({ ...prev, [interest.id]: e.target.value }))
                          }
                          className="w-full max-w-xs rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] px-3 py-2 text-sm font-semibold"
                        />
                        <CardanoAdaPay
                          label={`Send ${formatAda(parseFloat(adaInput) || 0)} to organizer`}
                          adaAmount={parseFloat(adaInput) || 0}
                          toAddress={organizerAddr || ''}
                          payload={{
                            kind: 'sponsorship',
                            eventId: interest.event_id,
                            eventTitle: event?.title || 'Event',
                            label: interest.sponsorship_type || interest.package?.title || 'Sponsorship',
                            toUserId: event?.organizer_id,
                            fromRole: 'sponsor',
                            note: interest.company_name || user?.full_name,
                          }}
                          helperText="After organizer approval you pay on Cardano Preprod. Tx is recorded on the interest + event budget."
                          onPaid={(result) => {
                            store.recordSponsorAdaPayment(interest.id, {
                              adaAmount: result.adaAmount,
                              txHash: result.txHash,
                              explorerUrl: result.explorerUrl,
                              fromWallet: result.fromAddress,
                            })
                            setVersion((v) => v + 1)
                          }}
                        />
                      </div>
                    )}

                    {(interest.status === 'new' || interest.status === 'rejected') && !interest.tx_hash && (
                      <p className="mt-3 text-xs text-[#5E6256]">
                        Waiting for organizer approval before on-chain ADA payment unlocks.
                      </p>
                    )}

                    {interest.status === 'confirmed' && !organizerAddr && !interest.tx_hash && (
                      <p className="mt-3 text-xs font-semibold text-amber-800">
                        Organizer has not saved a Cardano receive address yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
