import { useNavigate } from 'react-router'
import { DashboardLayout } from '@/components/DashboardLayout'
import store from '@/data/store'
import { Award, ArrowRight, ClipboardList, Ticket, Wallet } from 'lucide-react'

export default function ParticipantDashboard() {
  const navigate = useNavigate()
  const user = store.getCurrentUser()
  const stats = user
    ? store.getParticipantStats(user.id)
    : { registeredEvents: 0, upcomingEvents: 0, certificates: 0, proofRecords: 0 }

  const steps = [
    {
      title: 'Browse events',
      text: 'Find something to join and apply.',
      path: '/dashboard/participant/browse',
      icon: Ticket,
    },
    {
      title: 'My applications',
      text: 'Track pending and approved status.',
      path: '/dashboard/participant/applications',
      icon: ClipboardList,
    },
    {
      title: 'Tickets & Cardano check-in',
      text: 'After approval, check in on event day with your wallet.',
      path: '/dashboard/participant/tickets',
      icon: Wallet,
    },
    {
      title: 'Certificates',
      text: 'View certs — may include your Cardano tx hash.',
      path: '/dashboard/participant/certificates',
      icon: Award,
    },
  ]

  return (
    <DashboardLayout title="Participant">
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.75rem] bg-[#7C3AED] p-6 text-white shadow-[0_16px_40px_rgba(124,58,237,0.25)]">
          <Ticket className="h-7 w-7 opacity-90" />
          <h2 className="mt-4 text-xl font-bold">Join events</h2>
          <p className="mt-2 text-sm leading-6 text-white/85">
            Apply to events organizers created (often with AI). Get approved, then receive your ticket.
          </p>
        </div>
        <div className="dash-surface rounded-[1.75rem] p-6">
          <Wallet className="h-7 w-7 text-emerald-400" />
          <h2 className="mt-4 text-xl font-bold text-white">Cardano check-in</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">
            On event day, open My Tickets, connect your wallet, and sign to prove you attended.
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Registered', value: stats.registeredEvents },
          { label: 'Upcoming', value: stats.upcomingEvents },
          { label: 'Certificates', value: stats.certificates },
          { label: 'Proofs', value: stats.proofRecords },
        ].map((s) => (
          <div key={s.label} className="dash-surface rounded-2xl p-4">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <button
            key={step.path}
            type="button"
            onClick={() => navigate(step.path)}
            className="dash-surface flex items-start gap-4 rounded-2xl p-5 text-left transition hover:border-emerald-400/30"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <step.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white">{step.title}</h3>
              <p className="mt-1 text-xs leading-5 text-white/50">{step.text}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
          </button>
        ))}
      </div>
    </DashboardLayout>
  )
}
