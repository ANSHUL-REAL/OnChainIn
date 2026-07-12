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
        <div className="rounded-[1.75rem] bg-[#7C3AED] p-6 text-[#FFFFFF] shadow-[0_16px_40px_rgba(124,58,237,0.25)]">
          <Ticket className="h-7 w-7 opacity-90" />
          <h2 className="mt-4 text-xl font-bold">Join events</h2>
          <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/85">
            Apply to events organizers created (often with AI). Get approved, then receive your ticket.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-sm">
          <Wallet className="h-7 w-7 text-[#7C3AED]" />
          <h2 className="mt-4 text-xl font-bold text-[#192837]">Cardano check-in</h2>
          <p className="mt-2 text-sm leading-6 text-[#5E6256]">
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
          <div
            key={s.label}
            className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-[#192837]">{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5E6256]">
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
            className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 text-left shadow-sm transition hover:border-[#7C3AED]/30"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#7C3AED]">
              <step.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[#192837]">{step.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[#5E6256]">{step.text}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#7C3AED]" />
          </button>
        ))}
      </div>
    </DashboardLayout>
  )
}
