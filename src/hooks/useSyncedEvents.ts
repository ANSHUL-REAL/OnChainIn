import { useEffect, useState } from 'react';
import store from '@/data/store';
import { syncEventBySlugFromSupabase, syncPublishedEventsFromSupabase } from '@/lib/eventSync';

export function useSyncedEventLists() {
  const [, setVersion] = useState(0);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    let active = true;

    syncPublishedEventsFromSupabase()
      .then(() => {
        if (active) setVersion(version => version + 1);
      })
      .catch((err) => {
        if (active) setSyncError(err instanceof Error ? err.message : 'Could not load Supabase events.');
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    upcomingEvents: store.getPublishedEvents(),
    pastEvents: store.getPastPublishedEvents(),
    syncError,
  };
}

export function useSyncedPublishedEvents() {
  return useSyncedEventLists().upcomingEvents;
}

export function useSyncedEventBySlug(slug: string) {
  const [event, setEvent] = useState(() => store.getEventBySlug(slug));
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    let active = true;
    setEvent(store.getEventBySlug(slug));

    syncEventBySlugFromSupabase(slug)
      .then((syncedEvent) => {
        if (active && syncedEvent) setEvent(syncedEvent);
      })
      .catch((err) => {
        if (active) setSyncError(err instanceof Error ? err.message : 'Could not load this event.');
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return { event, syncError };
}
