import { useState } from 'react';
import { Link } from 'react-router';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { EventCard } from '@/components/EventCard';
import { useSyncedEventLists } from '@/hooks/useSyncedEvents';
import { CalendarDays } from 'lucide-react';

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const { upcomingEvents, pastEvents } = useSyncedEventLists();
  const events = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="eventos-light-app min-h-screen bg-[#F9F8F1] text-[#14150F]">
      <Navbar />
      <div className="pt-20 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#DCE8BE] bg-[#F9F8F1] p-6 shadow-[0_24px_70px_rgba(82,103,15,0.10)] sm:p-9">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#DCE8BE] blur-3xl" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#52670F]">Participant gateway</p>
            <h1 className="mt-3 text-5xl font-black leading-none text-[#14150F] sm:text-7xl">Browse Events</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5E6256]">
              Discover published events, apply with organizer forms, and receive QR tickets only after approval.
            </p>
          </div>
        </div>

        <div className="mb-7 flex gap-2 rounded-full border border-[#DCE8BE] bg-white p-1 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2.5 rounded-full text-sm font-black transition-colors ${activeTab === 'upcoming' ? 'bg-[#52670F] text-white shadow-sm' : 'text-[#52670F] hover:bg-[#F6FAE8]'}`}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-5 py-2.5 rounded-full text-sm font-black transition-colors ${activeTab === 'past' ? 'bg-[#52670F] text-white shadow-sm' : 'text-[#52670F] hover:bg-[#F6FAE8]'}`}
          >
            Past ({pastEvents.length})
          </button>
        </div>

        {events.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#D9D0B8] bg-[#F9F8F1] p-10 text-center">
            <CalendarDays className="mx-auto mb-4 h-12 w-12 text-[#52670F]/30" />
            <p className="text-sm font-semibold text-[#5E6256]">No {activeTab} events found.</p>
            <Link to="/dashboard/organizer/create-with-ai" className="mt-5 inline-flex rounded-full bg-[#52670F] px-5 py-2.5 text-sm font-black text-white">
              Create an Event
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => <EventCard key={event.id} event={event} action={activeTab === 'past' ? 'View History' : 'Apply for Event'} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
