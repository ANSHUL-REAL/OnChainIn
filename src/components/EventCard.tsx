import { Link } from 'react-router';
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { EventPoster } from '@/components/EventPoster';
import store from '@/data/store';
import { eventStatusBadgeClass, getEventDisplayStatus } from '@/lib/eventLifecycle';
import type { Event } from '@/types';

export function EventCard({ event, action = 'Open Event' }: { event: Event; action?: string }) {
  const displayStatus = getEventDisplayStatus(event);
  const location = [event.venue, event.city].filter(Boolean).join(', ') || 'Venue to be announced';

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group relative overflow-hidden rounded-[1.65rem] border border-[#DCE8BE] bg-[#F9F8F1] shadow-[0_20px_55px_rgba(82,103,15,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(82,103,15,0.16)]"
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#EEF5D9] to-transparent opacity-70" />
      <div className="relative h-52 overflow-hidden">
        <EventPoster event={event} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14150F]/62 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/50 bg-white/82 px-3 py-1 text-[10px] font-black text-[#A76A19] backdrop-blur-md">
            {event.category}
          </span>
          <span className={`rounded-full border px-3 py-1 text-[10px] font-black backdrop-blur-md ${eventStatusBadgeClass(displayStatus)}`}>
            {displayStatus}
          </span>
        </div>
      </div>

      <div className="relative p-5">
        <h3 className="text-xl font-black leading-tight text-[#14150F]">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#65685A]">{event.description}</p>

        <div className="mt-5 grid gap-2 text-xs font-semibold text-[#5E6256]">
          <span className="flex min-w-0 items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-[#52670F]" />
            {event.date}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-[#52670F]" />
            <span className="truncate">{location}</span>
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-[#52670F]" />
            {store.getEventRegistrations(event.id).length} / {event.max_participants} applicants
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[#E8DEC2] pt-4">
          <span className="text-sm font-black text-[#52670F]">{action}</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5D9] text-[#52670F] transition-colors group-hover:bg-[#52670F] group-hover:text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
