import store from '@/data/store';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types';

type SupabaseEventRow = {
  id: string;
  organizer_id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  date?: string;
  event_date?: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  city: string | null;
  poster_url: string | null;
  max_participants: number | null;
  status: Event['status'];
  created_at: string;
};

function normalizeEvent(row: SupabaseEventRow): Event {
  return {
    id: row.id,
    organizer_id: row.organizer_id,
    title: row.title,
    slug: row.slug,
    description: row.description || '',
    category: row.category || 'General',
    date: row.event_date || row.date || '',
    start_time: row.start_time || undefined,
    end_time: row.end_time || undefined,
    venue: row.venue || undefined,
    city: row.city || undefined,
    poster_url: row.poster_url,
    max_participants: row.max_participants || 100,
    status: row.status,
    created_at: row.created_at,
  };
}

const eventSelectWithEventDate = 'id, organizer_id, title, slug, description, category, event_date, start_time, end_time, venue, city, poster_url, max_participants, status, created_at';
const eventSelectWithDate = 'id, organizer_id, title, slug, description, category, date, start_time, end_time, venue, city, poster_url, max_participants, status, created_at';

function isMissingColumnError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('column') && (message.includes('does not exist') || message.includes('schema cache'));
}

async function selectPublishedEvents(dateColumn: 'event_date' | 'date') {
  return supabase!
    .from('events')
    .select(dateColumn === 'event_date' ? eventSelectWithEventDate : eventSelectWithDate)
    .eq('status', 'published')
    .order(dateColumn, { ascending: true });
}

async function selectEventBySlug(slug: string, dateColumn: 'event_date' | 'date') {
  return supabase!
    .from('events')
    .select(dateColumn === 'event_date' ? eventSelectWithEventDate : eventSelectWithDate)
    .eq('slug', slug)
    .maybeSingle();
}

export async function syncPublishedEventsFromSupabase() {
  if (!supabase) return store.getEvents();

  let { data, error } = await selectPublishedEvents('event_date');

  if (isMissingColumnError(error)) {
    ({ data, error } = await selectPublishedEvents('date'));
  }

  if (error) {
    throw new Error(error.message);
  }

  (data || []).forEach((row: SupabaseEventRow) => {
    store.upsertEvent(normalizeEvent(row as SupabaseEventRow));
  });

  return store.getEvents();
}

export async function syncEventBySlugFromSupabase(slug: string) {
  if (!supabase || !slug) return store.getEventBySlug(slug);

  let { data, error } = await selectEventBySlug(slug, 'event_date');

  if (isMissingColumnError(error)) {
    ({ data, error } = await selectEventBySlug(slug, 'date'));
  }

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return store.upsertEvent(normalizeEvent(data as SupabaseEventRow));
  }

  return undefined;
}
