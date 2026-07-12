import type { Event, EventMode } from '@/types';

export type EventDisplayStatus = 'Cancelled' | 'Draft' | 'Ended' | 'Live Today' | 'Upcoming';

/**
 * Resolve event economics mode.
 * Explicit event_mode wins; legacy events with ADA fee/pool → cardano; else free.
 */
export function getEventMode(event: Event | null | undefined): EventMode {
  if (!event) return 'free'
  if (event.event_mode === 'cardano' || event.event_mode === 'free') return event.event_mode
  const fee = event.participation_fee_ada || 0
  const pool = event.prize_pool_ada || 0
  if (fee > 0 || pool > 0) return 'cardano'
  // Default published events to cardano-capable when address was historically used;
  // prefer free for safety when nothing Cardano-specific is set.
  return 'free'
}

export function isCardanoEvent(event: Event | null | undefined): boolean {
  return getEventMode(event) === 'cardano'
}

export function isFreeEvent(event: Event | null | undefined): boolean {
  return getEventMode(event) === 'free'
}

/** When can people check in (QR / manual / Cardano)? */
export type CheckInPhase = 'draft' | 'cancelled' | 'not_open' | 'open' | 'closed';

export type CheckInWindow = {
  phase: CheckInPhase;
  /** Human message for tickets / desk */
  message: string;
  opensAt: Date | null;
  closesAt: Date | null;
  canCheckIn: boolean;
};

/** Minutes before start_time when check-in unlocks (doors open early). */
const CHECK_IN_EARLY_MINUTES = 60;

function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function isValidLocalDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function todayLocalDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseTimeOnDate(dateStr: string, timeStr: string | undefined, fallbackH: number, fallbackM: number) {
  const base = parseLocalDate(dateStr);
  if (!isValidLocalDate(base)) return null;
  let h = fallbackH;
  let m = fallbackM;
  if (timeStr && /^\d{1,2}:\d{2}/.test(timeStr)) {
    const [hh, mm] = timeStr.split(':').map(Number);
    h = Number.isFinite(hh) ? hh : fallbackH;
    m = Number.isFinite(mm) ? mm : fallbackM;
  }
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0);
}

function formatWhen(d: Date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Check-in is only allowed near / during the event — NOT as soon as approved.
 *
 * Window: [start_time − 60 min]  →  [end_time] on the event date.
 * Defaults: start 09:00, end 23:59 if times missing.
 */
export function getCheckInWindow(event: Event, now = new Date()): CheckInWindow {
  if (event.status === 'cancelled') {
    return {
      phase: 'cancelled',
      message: 'This event was cancelled. Check-in is disabled.',
      opensAt: null,
      closesAt: null,
      canCheckIn: false,
    };
  }
  if (event.status === 'draft') {
    return {
      phase: 'draft',
      message: 'Event is still a draft. Check-in opens after it is published and on event day.',
      opensAt: null,
      closesAt: null,
      canCheckIn: false,
    };
  }

  const start = parseTimeOnDate(event.date, event.start_time, 9, 0);
  let end = parseTimeOnDate(event.date, event.end_time, 23, 59);
  if (!start || !end) {
    return {
      phase: 'not_open',
      message: 'Event date is invalid. Check-in unavailable.',
      opensAt: null,
      closesAt: null,
      canCheckIn: false,
    };
  }

  // Overnight events: if end <= start, close next calendar day
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  const opensAt = new Date(start.getTime() - CHECK_IN_EARLY_MINUTES * 60 * 1000);
  const closesAt = end;
  const t = now.getTime();

  if (t < opensAt.getTime()) {
    return {
      phase: 'not_open',
      message: `Check-in opens ${formatWhen(opensAt)} (1 hour before start). Ticket is ready; wait for event day.`,
      opensAt,
      closesAt,
      canCheckIn: false,
    };
  }
  if (t > closesAt.getTime()) {
    return {
      phase: 'closed',
      message: `Check-in closed after ${formatWhen(closesAt)}. Contact the organizer if you need help.`,
      opensAt,
      closesAt,
      canCheckIn: false,
    };
  }

  return {
    phase: 'open',
    message: `Check-in is open until ${formatWhen(closesAt)}. Connect any CIP-30 wallet (Lace, Eternl, Nami, …) for Cardano attendance.`,
    opensAt,
    closesAt,
    canCheckIn: true,
  };
}

export function canCheckInToEvent(event: Event, now = new Date()) {
  return getCheckInWindow(event, now).canCheckIn;
}

export function isPastEvent(eventDate: string) {
  const date = parseLocalDate(eventDate);
  return isValidLocalDate(date) ? date.getTime() < todayLocalDate().getTime() : false;
}

export function isTodayEvent(eventDate: string) {
  const date = parseLocalDate(eventDate);
  return isValidLocalDate(date) ? date.getTime() === todayLocalDate().getTime() : false;
}

export function isUpcomingEvent(eventDate: string) {
  const date = parseLocalDate(eventDate);
  return isValidLocalDate(date) ? date.getTime() >= todayLocalDate().getTime() : true;
}

export function getEventDisplayStatus(event: Event): EventDisplayStatus {
  if (event.status === 'cancelled') return 'Cancelled';
  if (event.status === 'draft') return 'Draft';
  if (isPastEvent(event.date)) return 'Ended';
  if (isTodayEvent(event.date)) return 'Live Today';
  return 'Upcoming';
}

export function isActivePublishedEvent(event: Event) {
  return event.status === 'published' && isUpcomingEvent(event.date);
}

export function sortUpcomingEvents(events: Event[]) {
  return [...events].sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
}

export function sortPastEvents(events: Event[]) {
  return [...events].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
}

export function eventStatusBadgeClass(status: EventDisplayStatus) {
  if (status === 'Live Today') return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/20';
  if (status === 'Upcoming') return 'bg-[#E49B3A]/15 text-[#F7C56B] border-[#E49B3A]/25';
  if (status === 'Ended') return 'bg-zinc-500/20 text-zinc-300 border-zinc-400/15';
  if (status === 'Cancelled') return 'bg-red-500/20 text-red-300 border-red-400/20';
  return 'bg-white/10 text-white/35 border-white/10';
}
