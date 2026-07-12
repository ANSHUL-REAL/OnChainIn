import { useNavigate } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EventPoster } from '@/components/EventPoster';
import store from '@/data/store';
import { useSyncedPublishedEvents } from '@/hooks/useSyncedEvents';
import { Award, Calendar, Clock, ClipboardList, HeartHandshake, MapPin, Shield, Sparkles, Wrench, Lightbulb, Trophy } from 'lucide-react';

const defaultRequiredVolunteers = 14;

function getOpenVolunteerSlots(eventId: string) {
  const roles = store.getEventVolunteerRoles(eventId);
  const required = roles.length > 0 ? roles.reduce((sum, role) => sum + role.required_count, 0) : defaultRequiredVolunteers;
  const approved = store.getEventVolunteerApplications(eventId).filter(app => app.status === 'approved').length;
  return Math.max(required - approved, 0);
}

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const stats = user ? store.getVolunteerStats(user.id) : { applications: 0, approvedApplications: 0, assignedTasks: 0, completedHours: 0, skillsEarned: 0, proofRecords: 0 };
  const opportunities = useSyncedPublishedEvents().slice(0, 3);

  const statCards = [
    { icon: HeartHandshake, label: 'Applications Submitted', value: stats.applications },
    { icon: Award, label: 'Approved Applications', value: stats.approvedApplications },
    { icon: ClipboardList, label: 'Assigned Tasks', value: stats.assignedTasks },
    { icon: Clock, label: 'Completed Hours', value: stats.completedHours },
    { icon: Wrench, label: 'Skills Earned', value: stats.skillsEarned },
    { icon: Shield, label: 'Proof Records', value: stats.proofRecords },
  ];

  const actions = [
    {
      icon: HeartHandshake,
      title: 'Browse Volunteer Opportunities',
      text: 'Find upcoming events that need volunteers and apply for roles.',
      button: 'Browse Events',
      path: '/dashboard/volunteer/applications',
    },
    {
      icon: ClipboardList,
      title: 'My Assigned Tasks',
      text: 'Track event tasks assigned by organizers.',
      button: 'View Tasks',
      path: '/dashboard/volunteer/tasks',
    },
    {
      icon: Lightbulb,
      title: 'AI Role Recommendations',
      text: 'Get matched to the best volunteer roles for your skills.',
      button: 'Get Matched',
      path: '/dashboard/volunteer/recommendations',
    },
    {
      icon: Trophy,
      title: 'Leaderboard',
      text: 'See volunteer ranks, points, and badges across events.',
      button: 'View Leaderboard',
      path: '/dashboard/volunteer/leaderboard',
    },
    {
      icon: Shield,
      title: 'My Proof Passport',
      text: 'View verified volunteer contributions, hours, and skills.',
      button: 'View Proof',
      path: '/dashboard/volunteer/proof',
    },
  ];

  return (
    <DashboardLayout title="Volunteer Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="workspace-stat-card">
            <stat.icon className="w-5 h-5 mb-3" />
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-[10px] font-black tracking-wide uppercase text-[#5E6256]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {actions.map((action) => (
          <button key={action.title} onClick={() => navigate(action.path)} className="workspace-card rounded-[1.5rem] p-5 text-left">
            <span className="workspace-icon mb-3"><action.icon className="w-5 h-5" /></span>
            <h2 className="text-base font-black text-[#14150F]">{action.title}</h2>
            <p className="text-sm text-[#5E6256] mt-2 min-h-10">{action.text}</p>
            <span className="inline-flex mt-4 text-xs font-black text-[#52670F]">{action.button}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-[#14150F]">Recommended Opportunities</h2>
        <button onClick={() => navigate('/dashboard/volunteer/applications')} className="text-xs font-black text-[#52670F] hover:underline">View all</button>
      </div>

      {opportunities.length === 0 ? (
        <div className="workspace-empty">
          <Sparkles className="w-12 h-12 text-[#52670F]/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#5E6256]">No volunteer opportunities available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {opportunities.map((event) => (
            <div key={event.id} className="workspace-card rounded-[1.5rem] p-4 flex flex-col sm:flex-row gap-4">
              <EventPoster event={event} className="w-full sm:w-36 h-24 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF4DE] text-[#A06D11]">{event.category}</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#EEF7D7] text-[#52670F]">{getOpenVolunteerSlots(event.id)} volunteer slots</span>
                <h3 className="text-base font-black text-[#14150F] mt-1">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#5E6256] mt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue || event.city}</span>
                </div>
              </div>
              <button onClick={() => navigate('/dashboard/volunteer/applications')} className="gold-btn text-xs self-start sm:self-center">
                Apply as Volunteer
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
