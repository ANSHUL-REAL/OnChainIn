import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import store from '@/data/store'
import {
  Trophy,
  IndianRupee,
  CheckCircle,
  Loader2,
  Trash2,
  Wallet,
  Users,
  ArrowLeft,
} from 'lucide-react'

const PLACE_PRESETS = [
  { place: 1, label: '1st Prize', share: 0.5 },
  { place: 2, label: '2nd Prize', share: 0.3 },
  { place: 3, label: '3rd Prize', share: 0.2 },
]

export default function EventWinners() {
  const { id } = useParams<{ id: string }>()
  const event = store.getEventById(id || '')
  const [, setVersion] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const pool = event ? store.getPrizePool(event.id) : null
  const [poolAmount, setPoolAmount] = useState(String(pool?.total_amount || ''))
  const [poolNotes, setPoolNotes] = useState(pool?.notes || '')

  const [selectedUserId, setSelectedUserId] = useState('')
  const [place, setPlace] = useState(1)
  const [prizeLabel, setPrizeLabel] = useState('1st Prize')
  const [prizeAmount, setPrizeAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [payNote, setPayNote] = useState('')

  const attended = event
    ? store.getEventRegistrations(event.id).filter((r) => r.status === 'attended')
    : []
  const winners = event ? store.getEventWinners(event.id) : []
  const paidTotal = winners.filter((w) => w.status === 'paid').reduce((s, w) => s + w.prize_amount, 0)
  const selectedTotal = winners
    .filter((w) => w.status === 'selected')
    .reduce((s, w) => s + w.prize_amount, 0)
  const poolTotal = pool?.total_amount || 0
  const remaining = poolTotal - paidTotal - selectedTotal

  const attendeeOptions = useMemo(() => {
    return attended.map((r) => {
      const p = r.participant || store.getProfileById(r.participant_id)
      return {
        id: r.participant_id,
        name: p?.full_name || 'Participant',
        username: p?.username || '',
        address: p?.cardano_address || '',
      }
    })
  }, [attended, event?.id, winners.length])

  if (!event) {
    return (
      <DashboardLayout title="Winners & prizes">
        <p className="text-[#5E6256]">Event not found</p>
      </DashboardLayout>
    )
  }

  const savePool = () => {
    setError('')
    const amount = parseFloat(poolAmount) || 0
    store.setPrizePool(event.id, amount, 'INR', poolNotes.trim() || undefined)
    setVersion((v) => v + 1)
  }

  const applyPresetAmounts = () => {
    const total = parseFloat(poolAmount) || poolTotal
    if (total <= 0) {
      setError('Set a prize pool amount first')
      return
    }
    const preset = PLACE_PRESETS.find((p) => p.place === place)
    if (preset) {
      setPrizeLabel(preset.label)
      setPrizeAmount(String(Math.round(total * preset.share)))
    }
  }

  const selectWinner = () => {
    setError('')
    if (!selectedUserId) {
      setError('Pick a checked-in participant')
      return
    }
    try {
      store.selectEventWinner({
        eventId: event.id,
        userId: selectedUserId,
        place,
        prizeLabel: prizeLabel.trim() || `Place #${place}`,
        prizeAmount: parseFloat(prizeAmount) || 0,
        prizeCurrency: 'INR',
        walletAddress: walletAddress.trim() || undefined,
      })
      setSelectedUserId('')
      setWalletAddress('')
      setVersion((v) => v + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not select winner')
    }
  }

  const pay = async (winnerId: string) => {
    setError('')
    setBusy(winnerId)
    try {
      store.payEventWinner(winnerId, payNote.trim() || undefined)
      setPayNote('')
      setVersion((v) => v + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payout failed')
    } finally {
      setBusy(null)
    }
  }

  const remove = (winnerId: string) => {
    setError('')
    try {
      store.removeEventWinner(winnerId)
      setVersion((v) => v + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed')
    }
  }

  return (
    <DashboardLayout title="Winners & prize money">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            to={`/dashboard/organizer/events/${event.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to event
          </Link>
          <h2 className="mt-1 text-lg font-bold text-[#192837]">{event.title}</h2>
          <p className="text-sm text-[#5E6256]">
            Select placements from checked-in people, then mark prize money as paid (tracked in Budget).
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Prize pool */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7C3AED]">Prize pool</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-semibold text-[#5E6256]">Total pool (INR)</span>
              <div className="flex items-center gap-2 rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] px-3">
                <IndianRupee className="h-4 w-4 text-[#5E6256]" />
                <input
                  type="number"
                  min={0}
                  value={poolAmount}
                  onChange={(e) => setPoolAmount(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm font-semibold text-[#192837] focus:outline-none"
                  placeholder="50000"
                />
              </div>
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-semibold text-[#5E6256]">Notes</span>
              <input
                value={poolNotes}
                onChange={(e) => setPoolNotes(e.target.value)}
                className="w-full rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] px-3 py-2.5 text-sm text-[#192837] focus:outline-none"
                placeholder="Sponsored prize pool / hackathon awards"
              />
            </label>
            <button
              type="button"
              onClick={savePool}
              className="rounded-full bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white"
            >
              Save pool
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-[#5E6256]">Pool</p>
            <p className="text-xl font-bold text-[#192837]">₹{poolTotal.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-[#5E6256]">Allocated</p>
            <p className="text-xl font-bold text-amber-800">
              ₹{(paidTotal + selectedTotal).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-[#5E6256]">Remaining</p>
            <p className={`text-xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              ₹{remaining.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Select winner */}
      <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" />
          <h3 className="font-bold text-[#192837]">Pick a winner</h3>
        </div>
        {attended.length === 0 ? (
          <p className="text-sm text-[#5E6256]">
            No checked-in participants yet. Check people in first, then assign places.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="mb-1 block text-xs font-semibold text-[#5E6256]">Participant</span>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedUserId(id)
                  const opt = attendeeOptions.find((a) => a.id === id)
                  if (opt?.address) setWalletAddress(opt.address)
                }}
                className="w-full rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] px-3 py-2.5 text-sm font-semibold text-[#192837]"
              >
                <option value="">Select checked-in person…</option>
                {attendeeOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.username ? ` (@${a.username})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#5E6256]">Place</span>
              <select
                value={place}
                onChange={(e) => {
                  const p = Number(e.target.value)
                  setPlace(p)
                  const preset = PLACE_PRESETS.find((x) => x.place === p)
                  if (preset) setPrizeLabel(preset.label)
                }}
                className="w-full rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] px-3 py-2.5 text-sm font-semibold text-[#192837]"
              >
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>
                    #{p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#5E6256]">Prize label</span>
              <input
                value={prizeLabel}
                onChange={(e) => setPrizeLabel(e.target.value)}
                className="w-full rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] px-3 py-2.5 text-sm text-[#192837]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#5E6256]">Prize amount (₹)</span>
              <input
                type="number"
                min={0}
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
                className="w-full rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] px-3 py-2.5 text-sm text-[#192837]"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-[#5E6256]">
                Payout wallet / UPI note (optional)
              </span>
              <input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="addr_test1… or UPI id"
                className="w-full rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] px-3 py-2.5 font-mono text-xs text-[#192837]"
              />
            </label>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
              <button
                type="button"
                onClick={applyPresetAmounts}
                className="rounded-full border border-[#E7E1D2] bg-[#F6F2EB] px-4 py-2 text-xs font-bold text-[#192837]"
              >
                Suggest amount from pool (50/30/20)
              </button>
              <button
                type="button"
                onClick={selectWinner}
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2 text-xs font-bold text-white"
              >
                <Trophy className="h-3.5 w-3.5" /> Select winner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Winners list */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-[#192837]">
          <Users className="h-4 w-4 text-[#7C3AED]" /> Selected winners ({winners.length})
        </h3>
        <Link
          to={`/dashboard/organizer/events/${event.id}/budget`}
          className="text-xs font-semibold text-[#7C3AED]"
        >
          Open budget
        </Link>
      </div>

      {winners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-sm text-[#5E6256]">
          No winners selected yet.
        </div>
      ) : (
        <div className="space-y-3">
          <label className="mb-2 block text-xs font-semibold text-[#5E6256]">
            Payment note when marking paid (UPI ref / bank / ADA tx)
          </label>
          <input
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
            placeholder="e.g. UPI/123456 or Cardano tx hash"
            className="mb-3 w-full max-w-xl rounded-xl border border-[#E7E1D2] bg-white px-3 py-2 text-sm"
          />
          {winners.map((w) => (
            <div
              key={w.id}
              className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-900">
                #{w.place}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#192837]">{w.user?.full_name || 'Winner'}</p>
                <p className="text-xs text-[#5E6256]">
                  {w.prize_label} · ₹{w.prize_amount.toLocaleString()}
                  {w.wallet_address ? ` · ${w.wallet_address.slice(0, 18)}…` : ''}
                </p>
                {w.status === 'paid' && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                    Paid {w.paid_at ? new Date(w.paid_at).toLocaleString() : ''}
                    {w.payment_note ? ` · ${w.payment_note}` : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {w.status === 'selected' ? (
                  <>
                    <button
                      type="button"
                      disabled={busy === w.id}
                      onClick={() => void pay(w.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                    >
                      {busy === w.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wallet className="h-3 w-3" />
                      )}
                      Mark prize paid
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(w.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle className="h-3 w-3" /> Paid
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
