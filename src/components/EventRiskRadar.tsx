import { Activity, AlertTriangle, Clock, Radar } from 'lucide-react';
import store from '@/data/store';
import type { Event } from '@/types';

type RiskLevel = 'Safe' | 'Low' | 'Medium' | 'High';

function riskWeight(level: RiskLevel) {
  if (level === 'High') return 90;
  if (level === 'Medium') return 62;
  if (level === 'Low') return 34;
  return 12;
}

function riskTone(level: RiskLevel) {
  if (level === 'High') return 'border-[#F3A6A0] bg-[#FFF1EF] text-[#A84939]';
  if (level === 'Medium') return 'border-[#F0D18B] bg-[#FFF8E6] text-[#8A6718]';
  if (level === 'Low') return 'border-[#BFE4C5] bg-[#F1FFF5] text-[#147142]';
  return 'border-[#DCE8BE] bg-[#F7FBEA] text-[#52670F]';
}

function buildRiskIntelligence(event: Event) {
  const regs = store.getEventRegistrations(event.id);
  const pending = regs.filter(reg => reg.status === 'pending').length;
  const approved = regs.filter(reg => reg.status === 'approved').length;
  const attended = regs.filter(reg => reg.status === 'attended').length;
  const volunteerApps = store.getEventVolunteerApplications(event.id);
  const approvedVolunteers = volunteerApps.filter(app => app.status === 'approved').length;
  const tasks = store.getEventVolunteerTasks(event.id);
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const sponsorLeads = store.getEventSponsorInterests(event.id);
  const confirmedSponsors = sponsorLeads.filter(interest => interest.status === 'confirmed').length;
  const certificates = store.getEventCertificates(event.id).length;
  const expectedParticipants = Math.max(event.max_participants || 0, regs.length, approved, 1);
  const pendingShare = regs.length ? pending / regs.length : 0;
  const requiredVolunteers = Math.max(2, Math.ceil(expectedParticipants / 75));
  const volunteerGap = Math.max(0, requiredVolunteers - approvedVolunteers);
  const checkInVolunteers = volunteerApps.filter(app => {
    const text = `${app.role_requested || ''} ${app.role?.role_name || ''}`.toLowerCase();
    return app.status === 'approved' && (text.includes('registration') || text.includes('check') || text.includes('desk') || text.includes('entry'));
  }).length;
  const fallbackCheckInVolunteers = Math.max(checkInVolunteers, Math.min(approvedVolunteers, requiredVolunteers));
  const peakArrival = Math.ceil(Math.max(approved, Math.min(expectedParticipants, regs.length || expectedParticipants)) * 0.6);
  const checkInCapacity = Math.max(1, fallbackCheckInVolunteers) * 60;
  const estimatedWait = Math.max(8, Math.ceil((peakArrival / checkInCapacity) * 18));
  const certificateGap = Math.max(0, attended - certificates);
  const incompleteTasks = Math.max(0, tasks.length - completedTasks);
  const mobileReady = Boolean(event.venue || event.city) && approved > 0;
  const eventBudget = store.getEventBudgetItems(event.id);
  const eventIncome = eventBudget.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const eventExpenses = eventBudget.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const budgetBalance = eventIncome - eventExpenses;
  const minimumOpsBudget = Math.max(15000, expectedParticipants * 180);
  const projectedBudgetGap = Math.max(0, minimumOpsBudget - budgetBalance);
  const budgetLevel: RiskLevel = eventIncome === 0
    ? 'High'
    : budgetBalance < 0
      ? 'High'
      : budgetBalance < minimumOpsBudget * 0.35
        ? 'Medium'
        : budgetBalance < minimumOpsBudget * 0.65
          ? 'Low'
          : 'Safe';

  const risks = [
    {
      label: 'Registration risk',
      level: pendingShare > 0.45 ? 'High' as RiskLevel : pendingShare > 0.2 ? 'Medium' as RiskLevel : regs.length === 0 ? 'Medium' as RiskLevel : 'Low' as RiskLevel,
      reason: regs.length === 0 ? 'No applications are recorded yet, so demand is still unproven.' : `${pending} of ${regs.length} applications are still pending review.`,
      fix: pending > 0 ? 'Review pending applications and approve eligible participants before QR tickets are needed.' : 'Keep the form open and monitor daily registration velocity.',
    },
    {
      label: 'Volunteer shortage',
      level: volunteerGap >= 3 ? 'High' as RiskLevel : volunteerGap > 0 ? 'Medium' as RiskLevel : 'Safe' as RiskLevel,
      reason: `${approvedVolunteers} approved volunteers for ${expectedParticipants} expected attendees. Recommended minimum is ${requiredVolunteers}.`,
      fix: volunteerGap > 0 ? `Approve or recruit ${volunteerGap} more volunteers, prioritizing registration desk and floor coordination.` : 'Volunteer coverage looks healthy for the current expected crowd.',
    },
    {
      label: 'Check-in bottleneck',
      level: peakArrival > checkInCapacity ? 'High' as RiskLevel : peakArrival > checkInCapacity * 0.75 ? 'Medium' as RiskLevel : 'Low' as RiskLevel,
      reason: `${peakArrival} people may arrive during the peak window. Current QR desk capacity is about ${checkInCapacity} people/hour.`,
      fix: peakArrival > checkInCapacity ? `Add ${Math.ceil((peakArrival - checkInCapacity) / 60)} QR volunteer(s) or open an extra entry counter. Estimated wait: ${estimatedWait}+ minutes.` : 'Keep QR codes ready and assign one volunteer as overflow support.',
    },
    {
      label: 'Sponsor readiness',
      level: confirmedSponsors > 0 ? 'Safe' as RiskLevel : sponsorLeads.length > 0 ? 'Medium' as RiskLevel : 'High' as RiskLevel,
      reason: confirmedSponsors > 0 ? `${confirmedSponsors} sponsor partnership is confirmed.` : sponsorLeads.length > 0 ? `${sponsorLeads.length} sponsor lead(s), but none confirmed yet.` : 'No sponsor interest is recorded for this event.',
      fix: confirmedSponsors > 0 ? 'Prepare sponsor visibility proof and placement checklist.' : 'Send sponsor proposal with audience size, category fit, and expected visibility.',
    },
    {
      label: 'Budget adequacy',
      level: budgetLevel,
      reason: eventIncome === 0
        ? `No income is recorded. Minimum operating cushion for ${expectedParticipants} attendees is about Rs.${minimumOpsBudget.toLocaleString()}.`
        : `Income Rs.${eventIncome.toLocaleString()}, expenses Rs.${eventExpenses.toLocaleString()}, balance Rs.${budgetBalance.toLocaleString()}. Recommended cushion is Rs.${minimumOpsBudget.toLocaleString()}.`,
      fix: projectedBudgetGap > 0
        ? `Add Rs.${projectedBudgetGap.toLocaleString()} through sponsors, tickets, or reduce venue/material expenses before confirming scale.`
        : 'Budget cushion is enough for the current event scale. Keep vendor and certificate costs tracked.',
    },
    {
      label: 'Attendance completion',
      level: approved > 0 && attended > 0 && attended < approved ? 'Medium' as RiskLevel : 'Safe' as RiskLevel,
      reason: approved > 0 ? `${attended} of ${approved} approved participants are marked attended.` : 'No approved participants yet, so attendance is not ready to start.',
      fix: approved > 0 ? 'Use QR/manual check-in only for approved registrations and reconcile missing attendees after entry closes.' : 'Approve participants before opening check-in.',
    },
    {
      label: 'Certificate readiness',
      level: certificateGap > 10 ? 'High' as RiskLevel : certificateGap > 0 ? 'Medium' as RiskLevel : 'Safe' as RiskLevel,
      reason: certificateGap > 0 ? `${certificateGap} attended participant(s) do not have certificates yet.` : 'Certificate count is aligned with current attendance data.',
      fix: certificateGap > 0 ? 'Issue certificates after attendance reconciliation so proof passports stay accurate.' : 'Keep certificate template ready for post-event issuing.',
    },
    {
      label: 'Volunteer task coverage',
      level: tasks.length === 0 ? 'Medium' as RiskLevel : incompleteTasks > completedTasks + 1 ? 'High' as RiskLevel : incompleteTasks > 0 ? 'Low' as RiskLevel : 'Safe' as RiskLevel,
      reason: tasks.length === 0 ? 'No volunteer tasks are created yet.' : `${completedTasks} of ${tasks.length} volunteer tasks are completed.`,
      fix: tasks.length === 0 ? 'Create tasks for registration, stage, technical support, sponsor desk, and certificate support.' : 'Close or reassign incomplete tasks before event day.',
    },
    {
      label: 'Mobile/event-day readiness',
      level: mobileReady ? 'Low' as RiskLevel : 'Medium' as RiskLevel,
      reason: mobileReady ? 'Event has location context and approved participants for mobile workflows.' : 'Venue/city or approved ticket data is still incomplete.',
      fix: mobileReady ? 'Ask staff to test event detail page, QR ticket view, and attendance page on phones.' : 'Complete location details and approve test registrations before demo/event day.',
    },
  ];

  const score = Math.round(risks.reduce((sum, risk) => sum + riskWeight(risk.level), 0) / risks.length);
  const overallLevel: RiskLevel = score >= 72 ? 'High' : score >= 46 ? 'Medium' : score >= 24 ? 'Low' : 'Safe';
  const timeline = [
    {
      time: event.start_time || '10:00',
      title: 'Arrival wave',
      issue: `${peakArrival} participants may arrive in the first peak window.`,
      action: peakArrival > checkInCapacity ? `Add QR volunteers or open another counter to avoid ${estimatedWait}+ minute wait.` : 'Keep one overflow volunteer near the entry line.',
    },
    {
      time: '11:30',
      title: 'Session start',
      issue: pending > 0 ? `${pending} applications may still be unresolved before sessions begin.` : 'Applications are clear for the current event data.',
      action: pending > 0 ? 'Approve/reject pending applications before event day and send ticket status updates.' : 'Use the approved list as the room access source.',
    },
    {
      time: '14:00',
      title: 'Operations coverage',
      issue: incompleteTasks > 0 ? `${incompleteTasks} volunteer task(s) may still need completion or reassignment.` : 'Volunteer tasks are covered in current data.',
      action: incompleteTasks > 0 ? 'Reassign incomplete tasks to approved volunteers and reward completion on the leaderboard.' : 'Keep volunteer lead on standby for support requests.',
    },
    {
      time: '15:00',
      title: 'Budget control',
      issue: projectedBudgetGap > 0 ? `Projected operating cushion is short by Rs.${projectedBudgetGap.toLocaleString()}.` : `Budget cushion is healthy with Rs.${budgetBalance.toLocaleString()} remaining.`,
      action: projectedBudgetGap > 0 ? 'Confirm sponsor money, cap discretionary expenses, and avoid expanding capacity until budget is safe.' : 'Keep final vendor bills and certificate costs recorded for proof-ready finance.',
    },
    {
      time: event.end_time || '16:00',
      title: 'Proof closeout',
      issue: certificateGap > 0 ? `${certificateGap} attendees are missing certificates.` : 'Certificate readiness is safe based on current attendance data.',
      action: certificateGap > 0 ? 'Reconcile attendance and issue missing certificates before publishing proof passports.' : 'Export attendance list and issue final certificates.',
    },
  ];

  return { expectedParticipants, score, overallLevel, risks, timeline, approvedVolunteers, registrations: regs.length };
}

export function EventRiskRadar({ event }: { event: Event }) {
  const riskIntelligence = buildRiskIntelligence(event);
  const featuredRisks = [...riskIntelligence.risks].sort((a, b) => riskWeight(b.level) - riskWeight(a.level)).slice(0, 4);
  const secondaryRisks = riskIntelligence.risks.filter(risk => !featuredRisks.some(featured => featured.label === risk.label));

  return (
    <section className="organizer-risk-radar relative overflow-hidden rounded-[2.2rem] border border-[#CFE2A1] bg-[#F8FDEB] p-5 sm:p-6 shadow-[0_28px_75px_rgba(82,103,15,0.14)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_10%,rgba(216,240,102,0.52),transparent_22rem),radial-gradient(circle_at_10%_92%,rgba(244,196,103,0.18),transparent_20rem),linear-gradient(135deg,rgba(255,255,255,0.82),rgba(238,248,210,0.68))]" />
      <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(82,103,15,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(82,103,15,0.14)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.22em] text-[#52670F] uppercase">OnChainIn LiveOps Intelligence</p>
          <h2 className="mt-1 text-3xl font-black text-[#14150F]">Risk Radar + Event Day Simulator</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[#5E6256]">
          This reading is only for {event.title}: registrations, check-in load, volunteers, sponsors, budget, attendance, and certificates.
        </p>
      </div>

      <div className="relative grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="organizer-radar-control rounded-[1.8rem] border border-[#DCE8BE] bg-white/72 p-5 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.22em] text-[#52670F] uppercase">Analyzing event</p>
              <h3 className="mt-2 text-3xl font-black leading-none text-[#14150F]">{event.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5E6256]">
                {event.date} - {event.city || event.venue || 'Venue pending'}
              </p>
            </div>
            <span className="hidden sm:inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#52670F] text-white">
              <Radar className="h-6 w-6" />
            </span>
          </div>

          <div className="organizer-score-panel mt-6 rounded-[1.5rem] border border-[#DCE8BE] bg-[#F7FBEA] p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-[#6A7D1A] uppercase">Event risk score</p>
                <p className="mt-1 text-xs text-[#5E6256]">
                  {riskIntelligence.expectedParticipants} expected seats - {riskIntelligence.registrations} applications - {riskIntelligence.approvedVolunteers} approved volunteers
                </p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-right ${riskTone(riskIntelligence.overallLevel)}`}>
                <p className="text-3xl font-black">{riskIntelligence.score}</p>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.14em]">{riskIntelligence.overallLevel} risk</p>
              </div>
            </div>
            <div className="organizer-score-track mt-4 h-3 overflow-hidden rounded-full bg-[#E7E8D9]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7BCB74] via-[#F4C467] to-[#E36B61]"
                style={{ width: `${riskIntelligence.score}%` }}
              />
            </div>
          </div>

          <div className="organizer-featured-risks mt-5 grid sm:grid-cols-2 gap-3">
            {featuredRisks.map(risk => (
              <div key={risk.label} className={`organizer-risk-card rounded-2xl border p-4 ${riskTone(risk.level)}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black">{risk.label}</p>
                  <span className="rounded-full bg-white/70 px-2 py-1 text-[0.65rem] font-black uppercase">{risk.level}</span>
                </div>
                <p className="mt-2 text-xs leading-5 opacity-85">{risk.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="organizer-recommendation-panel rounded-[1.8rem] border border-[#DCE8BE] bg-white/78 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-[0.22em] text-[#52670F] uppercase">Recommended fixes</p>
                <h3 className="mt-1 text-2xl font-black text-[#14150F]">What this event needs</h3>
              </div>
              <AlertTriangle className="h-6 w-6 text-[#8A6718]" />
            </div>
            <div className="mt-4 grid gap-3">
              {secondaryRisks.slice(0, 3).map(risk => (
                <div key={risk.label} className="organizer-fix-card rounded-2xl border border-[#E0E7CC] bg-[#FBFFF1] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-1 text-[0.65rem] font-black uppercase ${riskTone(risk.level)}`}>{risk.level}</span>
                    <p className="text-sm font-black text-[#14150F]">{risk.label}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#5E6256]">{risk.fix}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="organizer-simulator-panel rounded-[1.8rem] border border-[#DCE8BE] bg-[#F7FBEA] p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#52670F]" />
              <p className="text-xs font-black tracking-[0.22em] text-[#52670F] uppercase">Event Day Simulator</p>
            </div>
            <div className="mt-4 space-y-3">
              {riskIntelligence.timeline.map(item => (
                <div key={`${event.id}-${item.time}-${item.title}`} className="organizer-timeline-card grid grid-cols-[4.6rem_1fr] gap-3 rounded-2xl bg-white/82 p-3 border border-[#E0E7CC]">
                  <div className="flex items-start gap-1 text-[#52670F]">
                    <Clock className="mt-0.5 h-3.5 w-3.5" />
                    <span className="text-xs font-black">{item.time}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#14150F]">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#5E6256]">{item.issue}</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#52670F]">Fix: {item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
