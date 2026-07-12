import { useState } from 'react'
import { useParams } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import store from '@/data/store'
import { Plus, Handshake, Blocks, ExternalLink, CheckCircle } from 'lucide-react'
import { explorerTxUrl, formatAda, truncateMiddle } from '@/lib/cardano'

export default function EventSponsors() {
  const { id } = useParams<{ id: string }>()
  const event = store.getEventById(id || '')
  const [, setVersion] = useState(0)
  if (!event) {
    return (
      <DashboardLayout title="Sponsors">
        <p className="text-[#5E6256]">Event not found</p>
      </DashboardLayout>
    )
  }

  const packages = store.getEventSponsorPackages(event.id)
  const interests = store.getEventSponsorInterests(event.id)
  const organizerAddr = store.getOrganizerCardanoAddress(event.id)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [level, setLevel] = useState<'standard' | 'premium' | 'platinum'>('standard')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    store.createSponsorPackage({
      event_id: event.id,
      title,
      description: desc,
      amount: parseFloat(amount) || 0,
      benefits: ['On-chain ADA sponsorship'],
      visibility_level: level,
    })
    setShowForm(false)
    setTitle('')
    setDesc('')
    setAmount('')
    setLevel('standard')
    setVersion((v) => v + 1)
  }

  const updateStatus = (interestId: string, status: 'new' | 'contacted' | 'confirmed' | 'rejected') => {
    store.updateSponsorInterest(interestId, { status })
    setVersion((v) => v + 1)
  }

  return (
    <DashboardLayout title="Sponsors">
      <div className="mb-5 rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] p-4">
        <div className="flex items-start gap-3">
          <Blocks className="mt-0.5 h-5 w-5 text-[#7C3AED]" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#192837]">Cardano sponsorship payments</p>
            <p className="mt-1 text-xs leading-5 text-[#5E6256]">
              1) Save your receive address under Event manage → Cardano settings. 2) Approve a sponsor interest
              (Contacted / Confirm). 3) Sponsor pays ADA on-chain to your address from their dashboard.
            </p>
            {organizerAddr ? (
              <p className="mt-2 font-mono text-[11px] font-semibold text-[#7C3AED]">
                Receiving: {truncateMiddle(organizerAddr, 16, 12)}
              </p>
            ) : (
              <p className="mt-2 text-xs font-semibold text-amber-800">
                No wallet saved yet — open Event manage and add your Cardano address first.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#192837]">Packages (ADA)</h2>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="mb-3 space-y-2 rounded-xl border border-[#E7E1D2] bg-white p-3 shadow-sm">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Package name"
                className="w-full rounded-lg border border-[#E7E1D2] px-2 py-1.5 text-xs"
              />
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description"
                className="w-full rounded-lg border border-[#E7E1D2] px-2 py-1.5 text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="ADA amount"
                  className="w-28 rounded-lg border border-[#E7E1D2] px-2 py-1.5 text-xs"
                />
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as 'standard' | 'premium' | 'platinum')}
                  className="flex-1 rounded-lg border border-[#E7E1D2] px-2 py-1.5 text-xs"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <button type="submit" className="gold-btn px-3 py-1.5 text-[10px]">
                Create ADA package
              </button>
            </form>
          )}

          {packages.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#5E6256]">No packages yet</p>
          ) : (
            <div className="space-y-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-xl border border-[#E7E1D2] bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#192837]">{pkg.title}</p>
                    <span className="text-sm font-bold text-[#7C3AED]">{formatAda(pkg.amount)}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-[#5E6256]">{pkg.description}</p>
                  <span className="mt-1 inline-block rounded-full bg-[#F2F2EE] px-1.5 py-0.5 text-[9px] font-bold capitalize text-[#5E6256]">
                    {pkg.visibility_level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-[#192837]">Sponsor interests ({interests.length})</h2>
          {interests.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#5E6256]">No interests yet</p>
          ) : (
            <div className="space-y-2">
              {interests.map((si) => (
                <div key={si.id} className="rounded-xl border border-[#E7E1D2] bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                      <Handshake className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#192837]">
                        {si.company_name || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-[#5E6256]">
                        {si.sponsor?.full_name} · {si.sponsorship_type || si.package?.title || 'General'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        si.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : si.status === 'rejected'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {si.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#5E6256]">{si.contribution_details || si.message}</p>
                  {si.tx_hash && (
                    <a
                      href={si.explorer_url || explorerTxUrl(si.tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED]"
                    >
                      <CheckCircle className="h-3 w-3" /> Paid {formatAda(si.ada_amount || 0)} on Cardano{' '}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {(si.status === 'new' || si.status === 'contacted') && !si.tx_hash && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {si.status === 'new' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(si.id, 'contacted')}
                          className="rounded bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700"
                        >
                          Mark contacted
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => updateStatus(si.id, 'confirmed')}
                        className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"
                      >
                        Approve for ADA payment
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(si.id, 'rejected')}
                        className="rounded bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {si.status === 'confirmed' && !si.tx_hash && (
                    <p className="mt-2 text-[10px] font-semibold text-emerald-800">
                      Approved — sponsor can now pay ADA from My Interests.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
