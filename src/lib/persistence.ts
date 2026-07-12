import { supabase } from '@/lib/supabase';

// Best-effort Supabase persistence for the Event Tech Track features.
//
// localStorage (src/data/store.ts) stays the synchronous source of truth so the
// UI always renders, even with no network / before migration 005 is applied.
// These helpers mirror the new-feature writes to Supabase when it is configured
// and the `etrack_*` tables exist. Failures are swallowed on purpose — they must
// never break the working demo.

export const isSupabaseEnabled = Boolean(supabase);

export type EtrackTable =
  | 'etrack_check_ins'
  | 'etrack_certificates'
  | 'etrack_sponsor_proposals'
  | 'etrack_volunteer_profiles'
  | 'etrack_volunteer_points';

/** Upsert a row. Fire-and-forget: callers should not await for UI updates. */
export async function pushRemote(
  table: EtrackTable,
  row: Record<string, unknown>,
  onConflict = 'id',
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'supabase-not-configured' };
  try {
    const { error } = await supabase.from(table).upsert(row, { onConflict });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

/** Read all rows from an etrack table, or null if unavailable. */
export async function pullRemote<T>(table: EtrackTable): Promise<T[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) return null;
    return (data as T[]) ?? null;
  } catch {
    return null;
  }
}

// Best-effort: establish a real Supabase auth session so writes happen under an
// authenticated context. Uses anonymous sign-in (if enabled on the project) and
// never throws — the demo "Continue as role" UX is unaffected either way.
let sessionPromise: Promise<void> | null = null;
export function ensureSupabaseSession(): Promise<void> {
  if (!supabase) return Promise.resolve();
  if (sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) return;
      await supabase.auth.signInAnonymously();
    } catch {
      // Anonymous auth may be disabled; etrack_* RLS is permissive regardless.
    }
  })();
  return sessionPromise;
}
