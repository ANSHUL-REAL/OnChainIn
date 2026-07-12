import { useNavigate } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EventPoster } from '@/components/EventPoster';
import store from '@/data/store';
import { eventStatusBadgeClass, getEventDisplayStatus, isPastEvent, isTodayEvent, isUpcomingEvent, sortPastEvents, sortUpcomingEvents } from '@/lib/eventLifecycle';
import { Plus, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

export default function OrganizerEvents() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const events = user ? store.getOrganizerEvents(user.id) : [];
  const groupedEvents = [
    { title: "Today's Events", events: sortUpcomingEvents(events.filter(event => event.status === 'published' && isTodayEvent(event.date))) },
    { title: 'Upcoming Events', events: sortUpcomingEvents(events.filter(event => event.status === 'published' && isUpcomingEvent(event.date) && !isTodayEvent(event.date))) },
    { title: 'Past Events', events: sortPastEvents(events.filter(event => event.status === 'published' && isPastEvent(event.date))) },
    { title: 'Drafts', events: events.filter(event => event.status === 'draft') },
    { title: 'Completed / Cancelled', events: events.filter(event => event.status === 'completed' || event.status === 'cancelled') },
  ].filter(group => group.events.length > 0);

  return (
    <DashboardLayout title="My Events">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/40">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        <button onClick={() => navigate('/dashboard/organizer/create-with-ai')} className="gold-btn flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Create with AI
        </button>
      </div>

      {events.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-sm text-white/30 mb-4">No events yet</p>
          <button onClick={() => navigate('/dashboard/organizer/create-with-ai')} className="gold-btn text-sm">Create Your First Event</button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map((group) => (
            <section key={group.title}>
              <h2 className="text-sm font-semibold text-white mb-3">{group.title}</h2>
              <div className="grid gap-4">
          {group.events.map((event) => {
            const regs = store.getEventRegistrations(event.id);
            const displayStatus = getEventDisplayStatus(event);
            return (
              <div key={event.id} className="glass-card rounded-lg p-4 cursor-pointer hover:border-[#E49B3A]/20 transition-colors" onClick={() => navigate(`/dashboard/organizer/events/${event.id}`)}>
                <div className="flex items-center gap-4">
                  <EventPoster event={event} variant="thumb" className="w-14 h-14 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white">{event.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-white/30 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.city}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {regs.length} registered</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${eventStatusBadgeClass(displayStatus)}`}>
                    {displayStatus}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                </div>
              </div>
            );
          })}
              </div>
            </section>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
