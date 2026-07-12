import { useNavigate } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import { SponsorImpactSummary } from '@/components/SponsorImpactSummary'
import store from '@/data/store'
import {
  Calendar,
  Handshake,
  CheckCircle,
  ArrowRight,
  Shield,
  Sparkles,
  Target,
  FileText,
} from 'lucide-react'

export default function SponsorDashboard() {
  const navigate = useNavigate()
  const user = store.getCurrentUser()
  const stats = user
    ? store.getSponsorStats(user.id)
    : { matchingEvents: 0, submittedInterests: 0, confirmedPartnerships: 0 }
  const interests = user ? store.getSponsorInterestsBySponsor(user.id) : []

  const statCards = [
    {
      icon: Calendar,
      label: 'Matching events',
      value: stats.matchingEvents,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      icon: Handshake,
      label: 'Interests sent',
      value: stats.submittedInterests,
      tone: 'bg-amber-50 text-amber-800',
    },
    {
      icon: CheckCircle,
      label: 'Confirmed',
      value: stats.confirmedPartnerships,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ]

  const actions = [
    {
      icon: Calendar,
      title: 'Browse events',
      text: 'Find events that match your sponsorship goals and submit interest.',
      path: '/dashboard/sponsor/events',
      highlight: true,
    },
    {
      icon: FileText,
      title: 'My interests',
      text: 'Track status of every sponsorship interest you submitted.',
      path: '/dashboard/sponsor/interests',
    },
    {
      icon: Target,
      title: 'AI pitch helper',
      text: 'Draft a sponsor pitch from event details and your goals.',
      path: '/dashboard/sponsor/pitch',
    },
  ]

  const statusTone = (status: string) => {
    if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200'
    if (status === 'contacted') return 'bg-sky-50 text-sky-700 border-sky-200'
    return 'bg-amber-50 text-amber-800 border-amber-200'
  }

  return (
    <DashboardLayout title="Sponsor">
      {/* Hero */}
      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] bg-[#7C3AED] p-6 text-[#FFFFFF] shadow-[0_16px_40px_rgba(124,58,237,0.25)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFFFFF]/70">
            Sponsor workspace
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Discover events. Show real impact.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#FFFFFF]/85">
            Submit interest, track confirmations, and use proof-backed reach from registrations and
            check-ins.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/sponsor/events')}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#7C3AED] shadow-sm transition hover:bg-[#F5F3FF]"
          >
            Browse events <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-sm">
          <Shield className="h-7 w-7 text-[#7C3AED]" />
          <h3 className="mt-3 text-lg font-bold text-[#192837]">Proof for sponsors</h3>
          <p className="mt-2 text-sm leading-6 text-[#5E6256]">
            Impact is calculated from registrations, check-ins, packages, and confirmed interests —
            not vanity claims.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm"
          >
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}
            >
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-3xl font-bold text-[#192837]">{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5E6256]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <h2 className="mb-3 text-lg font-bold text-[#192837]">Quick actions</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => navigate(action.path)}
            className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              action.highlight
                ? 'border-[#DDD6FE] bg-[#F5F3FF]'
                : 'border-black/[0.06] bg-white hover:border-[#7C3AED]/30'
            }`}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#7C3AED]">
              <action.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-bold text-[#192837]">{action.title}</p>
            <p className="mt-1 text-xs leading-5 text-[#5E6256]">{action.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#7C3AED]">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      {/* Interests */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#192837]">My interests</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard/sponsor/interests')}
          className="text-sm font-semibold text-[#7C3AED]"
        >
          View all
        </button>
      </div>

      {interests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center shadow-sm">
          <Handshake className="mx-auto h-10 w-10 text-[#7C3AED]/35" />
          <p className="mt-3 text-sm font-semibold text-[#5E6256]">No interests submitted yet</p>
          <p className="mt-1 text-xs text-[#5E6256]">
            Browse events and submit a sponsorship type to get started.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/sponsor/events')}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-4 py-2 text-xs font-bold text-[#FFFFFF]"
          >
            Browse events <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {interests.slice(0, 6).map((si) => (
            <div key={si.id} className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#7C3AED]">
                  <Handshake className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#192837]">{si.event?.title}</p>
                  <p className="text-xs text-[#5E6256]">
                    {si.package?.title || si.sponsorship_type || 'General interest'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${statusTone(si.status)}`}
                >
                  {si.status}
                </span>
              </div>
              {si.event && <SponsorImpactSummary eventId={si.event.id} compact />}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold text-[#192837]">OnChainIn proof for sponsors</p>
            <p className="mt-1 text-sm leading-6 text-[#5E6256]">
              Sponsor impact uses real registrations, approved attendees, check-ins, package
              benefits, and interest records — so outreach is grounded in event data.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
