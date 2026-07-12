-- OnChainIn multi-user cloud store
-- Run this entire file in Supabase → SQL Editor → New query → Run
--
-- Design: collection + id + jsonb payload (matches the app's localStorage store).
-- Works with demo string IDs (e.g. "e1", "demo-organizer") and crypto.randomUUID().
-- RLS is open for the hackathon MVP so anon clients can read/write.
-- Tighten policies before production.

create extension if not exists pgcrypto;

create table if not exists public.oci_store (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists oci_store_collection_idx on public.oci_store (collection);
create index if not exists oci_store_updated_idx on public.oci_store (updated_at desc);

create or replace function public.oci_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists oci_store_touch on public.oci_store;
create trigger oci_store_touch
  before update on public.oci_store
  for each row execute function public.oci_touch_updated_at();

alter table public.oci_store enable row level security;

drop policy if exists oci_store_select_all on public.oci_store;
drop policy if exists oci_store_insert_all on public.oci_store;
drop policy if exists oci_store_update_all on public.oci_store;
drop policy if exists oci_store_delete_all on public.oci_store;

-- Open policies for multi-user demo (anon + authenticated).
create policy oci_store_select_all on public.oci_store
  for select using (true);

create policy oci_store_insert_all on public.oci_store
  for insert with check (true);

create policy oci_store_update_all on public.oci_store
  for update using (true) with check (true);

create policy oci_store_delete_all on public.oci_store
  for delete using (true);

-- Realtime: allow clients to subscribe to oci_store changes
-- (In Dashboard → Database → Replication, enable oci_store if not auto.)
do $$
begin
  begin
    alter publication supabase_realtime add table public.oci_store;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

comment on table public.oci_store is 'OnChainIn multi-user shared store (events, registrations, attendance, etc.)';
