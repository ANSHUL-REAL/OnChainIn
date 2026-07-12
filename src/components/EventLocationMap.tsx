import { Building2, Compass, ExternalLink, LocateFixed, MapPin, Navigation, Route } from 'lucide-react';
import type { Event } from '@/types';

function cleanLocationPart(value?: string | null) {
  const next = (value || '')
    .trim()
    .replace(/\bcowoking\b/gi, 'coworking')
    .replace(/\s+/g, ' ');
  if (!next || next.toLowerCase() === 'to be announced') return '';
  return next;
}

export function getEventLocationQuery(event: Pick<Event, 'venue' | 'city' | 'title'>) {
  const query = [cleanLocationPart(event.venue), cleanLocationPart(event.city), 'India'].filter(Boolean).join(', ');
  return query || cleanLocationPart(event.title);
}

export function getGoogleMapsUrl(event: Pick<Event, 'venue' | 'city' | 'title'>) {
  const query = getEventLocationQuery(event);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getGoogleMapsEmbedUrl(event: Pick<Event, 'venue' | 'city' | 'title'>) {
  const query = getEventLocationQuery(event);
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=17&output=embed&iwloc=near`;
}

export function EventLocationMap({ event, variant = 'light' }: { event: Event; variant?: 'light' | 'dark' }) {
  const venue = cleanLocationPart(event.venue);
  const city = cleanLocationPart(event.city);
  const hasLocation = Boolean(venue || city);
  const mapsUrl = getGoogleMapsUrl(event);
  const embedUrl = getGoogleMapsEmbedUrl(event);
  const isCompact = variant === 'dark';

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#D9D2B9] bg-[#F7F3E8] text-[#14150F] shadow-[0_30px_90px_rgba(82,103,15,0.14)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#DCE8BE] blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#F5C66C]/24 blur-3xl" />
        <div className="absolute inset-x-8 top-1/2 hidden border-t border-dashed border-[#52670F]/18 lg:block" />
      </div>

      <div className={`relative grid ${isCompact ? 'lg:grid-cols-[0.95fr_1.05fr]' : 'lg:grid-cols-[0.98fr_1.02fr]'} items-stretch`}>
        <aside className="relative flex flex-col p-5 sm:p-7 lg:p-8">
          <div className="absolute right-0 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-transparent via-[#CFC4A7] to-transparent lg:block" />

          <div className="inline-flex items-center gap-2 rounded-full border border-[#D7E3B3] bg-[#FCFAF1]/80 px-3 py-2 shadow-sm">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF5D9] text-[#52670F]">
              <LocateFixed className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#52670F]">Venue Intel</p>
              <p className="text-xs font-semibold text-[#6A6D5D]">Live location layer</p>
            </div>
          </div>

          <h2 className="mt-7 max-w-2xl text-4xl font-black leading-[0.96] tracking-[-0.02em] sm:text-5xl xl:text-6xl">
            Know the room before you arrive.
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5E6256] sm:text-base">
            {hasLocation
              ? 'OnChainIn turns the venue into a clear arrival checkpoint, so participants, volunteers, sponsors, and organizers see the same location truth.'
              : 'The organizer has not added a venue yet. Add a city or venue to unlock the live map preview.'}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="group rounded-[1.35rem] border border-[#DCE8BE] bg-[#F9F8F1]/82 p-4 shadow-[0_16px_34px_rgba(82,103,15,0.08)] transition-transform hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7E5BE] text-[#A76A19]">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7D805E]">Venue</p>
                  <p className="mt-1 text-sm font-black text-[#14150F]">{venue || 'To be announced'}</p>
                </div>
              </div>
            </div>

            <div className="group rounded-[1.35rem] border border-[#DCE8BE] bg-[#F9F8F1]/82 p-4 shadow-[0_16px_34px_rgba(82,103,15,0.08)] transition-transform hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF5D9] text-[#52670F]">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7D805E]">City</p>
                  <p className="mt-1 text-sm font-black text-[#14150F]">{city || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#52670F] px-5 py-3.5 text-sm font-black text-white shadow-[0_16px_34px_rgba(82,103,15,0.22)] transition-transform hover:-translate-y-1 hover:bg-[#43540C] sm:w-fit"
          >
            <Navigation className="h-4 w-4" />
            Open in Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </aside>

        <div className="relative min-h-[23rem] p-4 sm:p-6 lg:p-8">
          {hasLocation ? (
            <div className="relative h-full min-h-[23rem]">
              <div className="absolute -left-3 top-8 hidden h-24 w-24 rounded-full border border-dashed border-[#AAB878] lg:block" />
              <div className="absolute -right-2 bottom-10 hidden h-16 w-16 rounded-full bg-[#F5C66C]/50 blur-xl lg:block" />

              <div className="relative h-full min-h-[23rem] overflow-hidden rounded-[1.75rem] border border-[#D8CCAC] bg-[#EEE7D6] shadow-[0_24px_70px_rgba(82,103,15,0.16)]">
                <iframe
                  title={`${event.title} location map`}
                  src={embedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full min-h-[23rem] w-full border-0 saturate-[0.86] sepia-[0.08] contrast-[1.02]"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F7F3E8]/70 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1A1D11]/45 to-transparent" />
                <div className="absolute left-4 top-4 max-w-[78%] rounded-full border border-[#D8CCAC] bg-[#F9F8F1]/90 px-4 py-2 text-xs font-black text-[#14150F] shadow-xl backdrop-blur-md">
                  {venue || event.title}
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#52670F] text-white shadow-xl transition-transform hover:scale-105"
                  aria-label="Open route planner"
                >
                  <Route className="h-4 w-4" />
                </a>
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-[#E4D7B6] bg-[#F9F8F1]/92 p-4 text-[#14150F] shadow-[0_18px_44px_rgba(20,21,15,0.16)] backdrop-blur-md">
                  <div className="flex items-center gap-2 text-[#A76A19]">
                    <Compass className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]">Meet Point</span>
                  </div>
                  <p className="mt-2 text-sm font-black">{[venue, city].filter(Boolean).join(', ')}</p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="pointer-events-auto rounded-[1.35rem] border border-[#D7E3B3] bg-[#EEF5D9]/94 p-4 text-[#14150F] shadow-[0_18px_44px_rgba(82,103,15,0.16)] backdrop-blur-md transition-transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-2 text-[#52670F]">
                    <Route className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]">Directions</span>
                  </div>
                  <p className="mt-2 text-sm font-black">Open route planner</p>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[23rem] items-center justify-center rounded-[1.75rem] border border-dashed border-[#D9D0B8] bg-[#F9F8F1]/70 p-8 text-center">
              <div className="relative">
                <div className="absolute left-1/2 top-9 h-28 w-px -translate-x-1/2 border-l border-dashed border-[#AAB878]" />
                <div className="relative mx-auto mb-16 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF5D9] text-[#52670F] shadow-lg">
                  <MapPin className="h-7 w-7" />
                </div>
                <p className="text-2xl font-black text-[#14150F]">Map unlocks after location is added</p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#5E6256]">Add venue and city while creating or editing the event so participants can open directions instantly.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
