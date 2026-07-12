/**
 * Multi-user cloud sync via Supabase `oci_store`.
 *
 * - localStorage remains the fast local cache
 * - When VITE_SUPABASE_URL + ANON_KEY are set, data is shared online
 * - Realtime keeps other browsers in sync
 */
import { supabase, isCloudEnabled } from '@/lib/supabase'

/** Map raw PostgREST / network errors to actionable UI text */
export function humanizeCloudError(raw: string): string {
  const m = (raw || '').toLowerCase()
  if (m.includes('pgrst205') || m.includes('could not find the table') || m.includes('oci_store')) {
    return 'Cloud table missing: run SQL migration 001_onchainin_multiuser.sql in Supabase → SQL Editor'
  }
  if (m.includes('jwt') || m.includes('invalid api key') || m.includes('401')) {
    return 'Supabase key rejected. Use the anon/publishable key from Project Settings → API'
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Network error reaching Supabase. Check URL and your connection'
  }
  return raw || 'Unknown cloud error'
}

/** Full SQL for dashboard “copy migration” helpers */
export const OCI_STORE_MIGRATION_SQL = `-- OnChainIn multi-user store (run once in Supabase SQL Editor)
create extension if not exists pgcrypto;
create table if not exists public.oci_store (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists oci_store_collection_idx on public.oci_store (collection);
alter table public.oci_store enable row level security;
drop policy if exists oci_store_select_all on public.oci_store;
drop policy if exists oci_store_insert_all on public.oci_store;
drop policy if exists oci_store_update_all on public.oci_store;
drop policy if exists oci_store_delete_all on public.oci_store;
create policy oci_store_select_all on public.oci_store for select using (true);
create policy oci_store_insert_all on public.oci_store for insert with check (true);
create policy oci_store_update_all on public.oci_store for update using (true) with check (true);
create policy oci_store_delete_all on public.oci_store for delete using (true);
do $$ begin
  begin alter publication supabase_realtime add table public.oci_store;
  exception when duplicate_object then null; when undefined_object then null; end;
end $$;`

export type CloudStatus = 'offline' | 'connecting' | 'online' | 'error'

type StoreRow = {
  collection: string
  id: string
  data: Record<string, unknown>
  updated_at?: string
}

/** Map localStorage keys → cloud collection names */
export const CLOUD_COLLECTIONS = [
  'profiles',
  'events',
  'registrations',
  'attendance',
  'event_form_fields',
  'volunteer_roles',
  'volunteer_applications',
  'volunteer_tasks',
  'sponsor_packages',
  'sponsor_interests',
  'budget_items',
  'certificates',
  'passport_records',
  'winner_selfies',
  'volunteer_profiles',
  'volunteer_points',
] as const

export type CloudCollection = (typeof CLOUD_COLLECTIONS)[number]

const LS_PREFIX = 'OnChainIn_'
const LS_SUFFIX = '_v2'

export function collectionToStorageKey(collection: string): string {
  // profiles → OnChainIn_profiles_v2
  // winner_selfies → OnChainIn_winner_selfies_v2
  return `${LS_PREFIX}${collection}${LS_SUFFIX}`
}

export function storageKeyToCollection(key: string): CloudCollection | null {
  if (!key.startsWith(LS_PREFIX) || !key.endsWith(LS_SUFFIX)) return null
  const mid = key.slice(LS_PREFIX.length, key.length - LS_SUFFIX.length)
  if ((CLOUD_COLLECTIONS as readonly string[]).includes(mid)) {
    return mid as CloudCollection
  }
  return null
}

type Listener = (status: CloudStatus, detail?: string) => void
const listeners = new Set<Listener>()

let status: CloudStatus = isCloudEnabled() ? 'connecting' : 'offline'
let lastError = ''
let pullInFlight: Promise<void> | null = null
let pushTimers = new Map<string, ReturnType<typeof setTimeout>>()
let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null
let started = false

export function getCloudStatus() {
  return { status, lastError, enabled: isCloudEnabled() }
}

export function onCloudStatus(fn: Listener) {
  listeners.add(fn)
  fn(status, lastError)
  return () => listeners.delete(fn)
}

function setStatus(next: CloudStatus, detail = '') {
  status = next
  lastError = detail
  listeners.forEach((fn) => fn(next, detail))
}

function readLocalArray(key: string): Array<Record<string, unknown> & { id?: string }> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalArray(key: string, rows: unknown[]) {
  const prev = localStorage.getItem(key)
  const next = JSON.stringify(rows)
  if (prev === next) return // skip no-op writes (stops UI flicker)
  localStorage.setItem(key, next)
  window.dispatchEvent(new CustomEvent('onchainin-storage', { detail: { key } }))
}

function mergeById(
  local: Array<Record<string, unknown> & { id?: string }>,
  remote: Array<Record<string, unknown> & { id?: string }>,
): Array<Record<string, unknown> & { id?: string }> {
  const map = new Map<string, Record<string, unknown> & { id?: string }>()
  for (const row of local) {
    if (row?.id) map.set(String(row.id), row)
  }
  for (const row of remote) {
    if (row?.id) map.set(String(row.id), { ...map.get(String(row.id)), ...row })
  }
  return Array.from(map.values())
}

/**
 * Pull all collections from Supabase → merge into localStorage.
 */
export async function pullFromCloud(): Promise<void> {
  if (!supabase || !isCloudEnabled()) {
    setStatus('offline', 'Supabase not configured')
    return
  }
  if (pullInFlight) return pullInFlight

  pullInFlight = (async () => {
    setStatus('connecting')
    try {
      const { data, error } = await supabase
        .from('oci_store')
        .select('collection, id, data, updated_at')
        .order('updated_at', { ascending: true })

      if (error) throw error

      const byCollection = new Map<string, Array<Record<string, unknown> & { id?: string }>>()

      for (const row of (data || []) as StoreRow[]) {
        const col = row.collection
        if (!(CLOUD_COLLECTIONS as readonly string[]).includes(col)) continue
        const list = byCollection.get(col) || []
        const payload = { ...(row.data || {}), id: row.id }
        list.push(payload)
        byCollection.set(col, list)
      }

      for (const col of CLOUD_COLLECTIONS) {
        const key = collectionToStorageKey(col)
        const local = readLocalArray(key)
        const remote = byCollection.get(col) || []
        if (remote.length === 0 && local.length > 0) {
          // First device with data: push local up later
          continue
        }
        const merged = mergeById(local, remote)
        writeLocalArray(key, merged)
      }

      setStatus('online')
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const msg = humanizeCloudError(raw)
      console.warn('[cloudSync] pull failed', raw)
      setStatus('error', msg)
    } finally {
      pullInFlight = null
    }
  })()

  return pullInFlight
}

/**
 * Push one local collection array to Supabase (upsert each row).
 */
export async function pushCollection(collection: CloudCollection): Promise<void> {
  if (!supabase || !isCloudEnabled()) return

  const key = collectionToStorageKey(collection)
  const rows = readLocalArray(key)
  if (rows.length === 0) return

  const payload: StoreRow[] = rows
    .filter((r) => r && r.id)
    .map((r) => ({
      collection,
      id: String(r.id),
      data: r,
    }))

  if (payload.length === 0) return

  // Upsert in chunks
  const chunkSize = 50
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize)
    const { error } = await supabase.from('oci_store').upsert(chunk, {
      onConflict: 'collection,id',
    })
    if (error) {
      console.warn('[cloudSync] push failed', collection, error.message)
      setStatus('error', error.message)
      return
    }
  }
  setStatus('online')
}

/** Debounced push after local writes */
export function schedulePushCollection(collection: CloudCollection, delayMs = 400) {
  if (!isCloudEnabled()) return
  const prev = pushTimers.get(collection)
  if (prev) clearTimeout(prev)
  pushTimers.set(
    collection,
    setTimeout(() => {
      void pushCollection(collection)
    }, delayMs),
  )
}

/**
 * Called from store.setItem when a known collection changes.
 */
export function notifyLocalWrite(storageKey: string) {
  const col = storageKeyToCollection(storageKey)
  if (col) schedulePushCollection(col)
}

/**
 * Push all local collections (first-time seed to empty cloud).
 */
export async function pushAllLocalToCloud(): Promise<void> {
  if (!isCloudEnabled()) return
  for (const col of CLOUD_COLLECTIONS) {
    await pushCollection(col)
  }
}

/**
 * Start pull + realtime subscription. Call once from app root.
 */
export async function startCloudSync(): Promise<void> {
  if (started) return
  started = true

  if (!supabase || !isCloudEnabled()) {
    setStatus('offline', 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to go multi-user')
    return
  }

  await pullFromCloud()

  // If cloud empty but local has seed data, publish seed once
  try {
    const { count, error } = await supabase
      .from('oci_store')
      .select('*', { count: 'exact', head: true })
    if (!error && (count === 0 || count === null)) {
      await pushAllLocalToCloud()
    }
  } catch {
    /* ignore */
  }

  // Realtime: any change from another user → re-pull
  try {
    channel = supabase
      .channel('onchainin-oci-store')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'oci_store' },
        () => {
          void pullFromCloud()
        },
      )
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') setStatus('online')
        if (s === 'CHANNEL_ERROR') setStatus('error', 'Realtime channel error')
      })
  } catch (err) {
    console.warn('[cloudSync] realtime failed', err)
  }

  // Periodic soft pull (backup if realtime off) — keep gentle to avoid UI flicker
  window.setInterval(() => {
    void pullFromCloud()
  }, 45_000)
}

export function stopCloudSync() {
  if (channel && supabase) {
    void supabase.removeChannel(channel)
    channel = null
  }
  started = false
}
