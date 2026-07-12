import { useState } from 'react';
import { Shield } from 'lucide-react';
import type { Event } from '@/types';

type EventPosterProps = {
  event: Event;
  variant?: 'card' | 'banner' | 'thumb';
  className?: string;
};

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join('') || 'EO';
}

export function EventPoster({ event, variant = 'card', className = '' }: EventPosterProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(event.poster_url) && !imageFailed;
  const isBanner = variant === 'banner';
  const isThumb = variant === 'thumb';

  const fallback = (
    <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_18%_16%,rgba(216,240,102,0.46),transparent_14rem),linear-gradient(135deg,#F7F6EB,#E7F0D1_54%,#CFE1A7)] ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.72),transparent_38%,rgba(92,116,21,0.12))]" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/55 blur-xl" />
      <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-[#52670F]/10 blur-lg" />
      <div className={`relative h-full w-full flex ${isThumb ? 'items-center justify-center' : 'items-end'} p-4`}>
        {isThumb ? (
          <span className="text-sm font-black text-[#52670F]">{initials(event.title)}</span>
        ) : (
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9D9A8] bg-white/70 px-3 py-1 text-[10px] font-black text-[#52670F] mb-3">
              <Shield className="w-3 h-3" />
              {event.category}
            </div>
            <p className={`${isBanner ? 'text-3xl sm:text-4xl' : 'text-2xl'} font-black text-[#14150F]`}>{initials(event.title)}</p>
            <p className="text-xs text-[#52670F] font-semibold mt-1">OnChainIn Event</p>
          </div>
        )}
      </div>
    </div>
  );

  if (!showImage) return fallback;

  return (
    <img
      src={event.poster_url || undefined}
      alt={event.title}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
