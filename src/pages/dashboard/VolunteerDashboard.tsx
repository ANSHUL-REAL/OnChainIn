import { useNavigate } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import { EventPoster } from '@/components/EventPoster'
import store from '@/data/store'
import { useSyncedPublishedEvents } from '@/hooks/useSyncedEvents'
import {
  Award,
  Calendar,
  Clock,
  ClipboardList,
  HeartHandshake,
  MapPin,
  Shield,
  Sparkles,
  Wrench,
  Lightbulb,
  Trophy,
  ArrowRight,
} from 'lucide-react'

const defaultRequiredVolunteers = 14

function getOpenVolunteerSlots(eventId: string) {
  const roles = store.getEventVolunteerRoles(eventId)
  const required =
    roles.length > 0
      ? roles.reduce((sum, role) => sum + role.required_count, 0)
      : defaultRequiredVolunteers
  const approved = store
    .getEventVolunteerApplications(eventId)
    .filter((app) => app.status === 'approved').length
  return Math.max(required - approved, 0)
}

export default function VolunteerDashboard() {
  const navigate = useNavigate()
  const user = store.getCurrentUser()
  const stats = user
    ? store.getVolunteerStats(user.id)
    : {
        applications: 0,
        approvedApplications: 0,
        assignedTasks: 0,
        completedHours: 0,
        skillsEarned: 0,
        proofRecords: 0,
      }
  const opportunities = useSyncedPublishedEvents().slice(0, 3)

  const statCards = [
    { icon: HeartHandshake, label: 'Applications', value: stats.applications, tone: 'bg-violet-50 text-violet-700' },
    { icon: Award, label: 'Approved', value: stats.approvedApplications, tone: 'bg-emerald-50 text-emerald-700' },
    { icon: ClipboardList, label: 'Tasks', value: stats.assignedTasks, tone: 'bg-sky-50 text-sky-700' },
    { icon: Clock, label: 'Hours', value: stats.completedHours, tone: 'bg-amber-50 text-amber-800' },
    { icon: Wrench, label: 'Skills', value: stats.skillsEarned, tone: 'bg-rose-50 text-rose-700' },
    { icon: Shield, label: 'Proofs', value: stats.proofRecords, tone: 'bg-lime-50 text-lime-800' },
  ]

  const actions = [
    {
      icon: HeartHandshake,
      title: 'Browse opportunities',
      text: 'Find upcoming events that need volunteers and apply for roles.',
      button: 'Browse events',
      path: '/dashboard/volunteer/applications',
      highlight: true,
    },
    {
      icon: ClipboardList,
      title: 'My assigned tasks',
      text: 'Track event tasks assigned by organizers.',
      button: 'View tasks',
      path: '/dashboard/volunteer/tasks',
    },
    {
      icon: Lightbulb,
      title: 'AI role match',
      text: 'Get matched to the best volunteer roles for your skills.',
      button: 'Get matched',
      path: '/dashboard/volunteer/recommendations',
    },
    {
      icon: Trophy,
      title: 'Leaderboard',
      text: 'See ranks, points, and badges across events.',
      button: 'View ranks',
      path: '/dashboard/volunteer/leaderboard',
    },
    {
      icon: Shield,
      title: 'Proof passport',
      text: 'Verified hours, skills, and contributions.',
      button: 'View proof',
      path: '/dashboard/volunteer/proof',
    },
  ]

  return (
    <DashboardLayout title="Volunteer">
      {/* Hero */}
      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] bg-[#7C3AED] p-6 text-[#FFFFFF] shadow-[0_16px_40px_rgba(124,58,237,0.25)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFFFFF]/70">
            Volunteer workspace
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Help run events. Build a proof portfolio.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#FFFFFF]/85">
            Apply for roles, complete tasks, and earn verified proof you can show on your passport.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/volunteer/applications')}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#7C3AED] shadow-sm transition hover:bg-[#F5F3FF]"
          >
            Find opportunities <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-sm">
          <Sparkles className="h-7 w-7 text-[#7C3AED]" />
          <h3 className="mt-3 text-lg font-bold text-[#192837]">How it works</h3>
          <ol className="mt-3 space-y-2 text-sm text-[#5E6256]">
            <li className="flex gap-2">
              <span className="font-bold text-[#7C3AED]">1.</span> Apply for open event roles
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#7C3AED]">2.</span> Get approved by the organizer
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#7C3AED]">3.</span> Complete tasks → proof passport
            </li>
          </ol>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm"
          >
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}
            >
              <stat.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-bold text-[#192837]">{stat.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5E6256]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <h2 className="mb-3 text-lg font-bold text-[#192837]">Quick actions</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <h3 className="mt-3 font-bold text-[#192837]">{action.title}</h3>
            <p className="mt-1 text-xs leading-5 text-[#5E6256]">{action.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#7C3AED]">
              {action.button} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      {/* Opportunities */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#192837]">Open opportunities</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard/volunteer/applications')}
          className="text-sm font-semibold text-[#7C3AED]"
        >
          View all
        </button>
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center shadow-sm">
          <Sparkles className="mx-auto h-10 w-10 text-[#7C3AED]/35" />
          <p className="mt-3 text-sm font-semibold text-[#5E6256]">
            No volunteer opportunities yet. When organizers publish events, they show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {opportunities.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <EventPoster
                event={event}
                className="h-24 w-full flex-shrink-0 rounded-xl sm:w-36"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    {event.category}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    {getOpenVolunteerSlots(event.id)} slots open
                  </span>
                </div>
                <h3 className="mt-1.5 truncate text-base font-bold text-[#192837]">{event.title}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#5E6256]">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {event.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {event.venue || event.city}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/volunteer/applications')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-4 py-2.5 text-xs font-bold text-[#FFFFFF] shadow-sm transition hover:bg-[#6D28D9] self-start sm:self-center"
              >
                Apply as volunteer
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
