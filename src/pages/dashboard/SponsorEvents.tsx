import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EventPoster } from '@/components/EventPoster';
import { SponsorImpactSummary } from '@/components/SponsorImpactSummary';
import store from '@/data/store';
import { useSyncedPublishedEvents } from '@/hooks/useSyncedEvents';
import { eventStatusBadgeClass, getEventDisplayStatus } from '@/lib/eventLifecycle';
import { Calendar, CheckCircle, Gift, Handshake, MapPin, Sparkles, Users } from 'lucide-react';

const sponsorTypes = [
  'Title Sponsor',
  'Venue / Event Place',
  'Swags & Merchandise',
  'Food & Beverages',
  'Prize Pool',
  'Tech / Internet Partner',
  'Media / Promotion',
  'Workshop Kit Partner',
];

export default function SponsorEvents() {
  const user = store.getCurrentUser();
  const events = useSyncedPublishedEvents();
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, string>>({});

  const handleInterest = (eventId: string) => {
    if (!user) return;
    const sponsorshipType = selectedType[eventId] || sponsorTypes[0];
    const contribution = details[eventId]?.trim();

    store.createSponsorInterest({
      event_id: eventId,
      sponsor_id: user.id,
      package_id: undefined,
      company_name: user.full_name || user.username || 'Sponsor Partner',
      sponsorship_type: sponsorshipType,
      contribution_details: contribution,
      message: contribution
        ? `${sponsorshipType}: ${contribution}`
        : `Interested in ${sponsorshipType} sponsorship.`,
      status: 'new',
    });
    setSubmitted(prev => new Set([...prev, eventId]));
  };

  return (
    <DashboardLayout title="Browse Events">
      {events.length === 0 ? (
        <div className="workspace-empty">
          <Sparkles className="w-12 h-12 text-[#52670F]/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#5E6256]">No sponsor-ready upcoming events are available yet.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {events.map((event) => {
            const regs = store.getEventRegistrations(event.id);
            const isSubmitted = submitted.has(event.id);
            const displayStatus = getEventDisplayStatus(event);

            return (
              <div key={event.id} className="workspace-card rounded-[1.75rem] p-4 sm:p-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <EventPoster event={event} className="h-36 w-full flex-shrink-0 rounded-[1.25rem] sm:w-44" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#FFF4DE] px-3 py-1 text-[10px] font-black text-[#A06D11]">{event.category}</span>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${eventStatusBadgeClass(displayStatus)}`}>{displayStatus}</span>
                      </div>
                      <h3 className="mt-3 text-2xl font-black text-[#14150F]">{event.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5E6256]">{event.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#5E6256]">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {event.date}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[event.venue, event.city].filter(Boolean).join(', ') || 'Venue TBD'}</span>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {regs.length} / {event.max_participants}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-[#DCE8BE] bg-[#F9F8F1] p-4">
                    {isSubmitted ? (
                      <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                        <CheckCircle className="mb-3 h-10 w-10 text-emerald-600" />
                        <p className="text-base font-black text-[#14150F]">Sponsor interest submitted</p>
                        <p className="mt-1 text-xs leading-5 text-[#5E6256]">Organizer can now review your selected sponsorship type.</p>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <Gift className="h-5 w-5 text-[#52670F]" />
                          <p className="text-sm font-black text-[#14150F]">What do you want to sponsor?</p>
                        </div>
                        <select
                          value={selectedType[event.id] || sponsorTypes[0]}
                          onChange={e => setSelectedType(prev => ({ ...prev, [event.id]: e.target.value }))}
                          className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-sm font-black text-[#14150F] focus:border-[#52670F]/50 focus:outline-none"
                        >
                          {sponsorTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <textarea
                          value={details[event.id] || ''}
                          onChange={e => setDetails(prev => ({ ...prev, [event.id]: e.target.value }))}
                          rows={3}
                          placeholder="Example: We can provide 200 T-shirts and winner goodies."
                          className="mt-3 w-full resize-none rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-sm font-semibold text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
                        />
                        <button onClick={() => handleInterest(event.id)} className="gold-btn mt-3 flex w-full items-center justify-center gap-2 text-sm">
                          <Handshake className="h-4 w-4" /> Submit Sponsor Interest
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <SponsorImpactSummary eventId={event.id} compact />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
