import { useNavigate } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import store from '@/data/store'
import {
  eventStatusBadgeClass,
  getEventDisplayStatus,
  isUpcomingEvent,
  sortUpcomingEvents,
} from '@/lib/eventLifecycle'
import {
  ArrowRight,
  Award,
  Blocks,
  Bot,
  Calendar,
  QrCode,
  Users,
} from 'lucide-react'

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const user = store.getCurrentUser()
  const events = user ? store.getOrganizerEvents(user.id) : []
  const active = sortUpcomingEvents(
    events.filter((e) => e.status === 'published' && isUpcomingEvent(e.date)),
  )
  const eventIds = events.map((e) => e.id)
  const regs = store.getRegistrations().filter((r) => eventIds.includes(r.event_id))
  const pending = regs.filter((r) => r.status === 'pending').length
  const approved = regs.filter((r) => r.status === 'approved').length
  const attended = regs.filter((r) => r.status === 'attended').length
  const onChain = store
    .getAttendance()
    .filter((a) => eventIds.includes(a.event_id) && a.tx_hash).length

  const actions = [
    {
      icon: Bot,
      title: 'Create with AI',
      text: 'Describe your event in one prompt. Edit and publish.',
      path: '/dashboard/organizer/create-with-ai',
      primary: true,
    },
    {
      icon: Calendar,
      title: 'My events',
      text: 'Open forms, approvals, and rooms.',
      path: '/dashboard/organizer/events',
    },
    {
      icon: QrCode,
      title: 'Check-in',
      text: 'QR desk + Cardano on-chain check-in on event day.',
      path: events[0]
        ? `/dashboard/organizer/events/${events[0].id}/attendance`
        : '/dashboard/organizer/events',
    },
    {
      icon: Award,
      title: 'Certificates',
      text: 'Issue certs; bind Cardano tx hash when available.',
      path: events[0]
        ? `/dashboard/organizer/events/${events[0].id}/certificates`
        : '/dashboard/organizer/events',
    },
  ]

  return (
    <DashboardLayout title="Organizer">
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/dashboard/organizer/create-with-ai')}
          className="rounded-[1.75rem] bg-[#7C3AED] p-6 text-left text-[#FFFFFF] shadow-[0_16px_40px_rgba(124,58,237,0.28)] transition hover:brightness-105"
        >
          <Bot className="h-8 w-8 opacity-90" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">Create events with AI</h2>
          <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/85">
            One prompt → draft event, form, volunteers, and certificate setup. Then edit and publish.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
            Open AI builder <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-sm">
          <Blocks className="h-8 w-8 text-[#7C3AED]" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#192837]">
            Check-in on Cardano
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#5E6256]">
            On event day, attendees sign with a wallet. Attendance is on-chain; certificates can show
            the tx hash for verification.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#5E6256]">
            <span className="rounded-full bg-[#F2F2EE] px-3 py-1">{pending} pending</span>
            <span className="rounded-full bg-[#F2F2EE] px-3 py-1">{approved} approved</span>
            <span className="rounded-full bg-[#F2F2EE] px-3 py-1">{attended} checked in</span>
            <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-[#7C3AED]">
              {onChain} on-chain
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <button
            key={a.path + a.title}
            type="button"
            onClick={() => navigate(a.path)}
            className="rounded-2xl border border-black/[0.06] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <a.icon className="h-5 w-5 text-[#7C3AED]" />
            <h3 className="mt-3 font-bold text-[#192837]">{a.title}</h3>
            <p className="mt-1 text-xs leading-5 text-[#5E6256]">{a.text}</p>
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#192837]">Your events</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard/organizer/events')}
          className="text-sm font-semibold text-[#7C3AED]"
        >
          View all
        </button>
      </div>

      {active.length === 0 && events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-[#7C3AED]/40" />
          <p className="mt-3 text-sm text-[#5E6256]">No events yet. Start with AI create.</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/organizer/create-with-ai')}
            className="gold-btn mt-4 inline-flex"
          >
            Create with AI
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {(active.length ? active : events).slice(0, 6).map((event) => {
            const status = getEventDisplayStatus(event)
            const er = store.getEventRegistrations(event.id)
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => navigate(`/dashboard/organizer/events/${event.id}`)}
                className="flex w-full items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 text-left shadow-sm transition hover:border-[#7C3AED]/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${eventStatusBadgeClass(status)}`}
                    >
                      {status}
                    </span>
                    <span className="text-[10px] font-semibold text-[#5E6256]">{event.category}</span>
                  </div>
                  <p className="mt-1 truncate font-bold text-[#192837]">{event.title}</p>
                  <p className="text-xs text-[#5E6256]">
                    {event.date}
                    {event.city ? ` · ${event.city}` : ''} · {er.length} applications
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#7C3AED]" />
              </button>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
