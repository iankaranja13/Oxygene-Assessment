-- LaunchPad shared state in Supabase (Postgres).
-- Safe to run more than once. Run with: node scripts/apply-schema.mjs
--
-- SECURITY NOTE (stated honestly, see docs/DECISIONS.md D24): the app has no real login,
-- so these tables are readable and writable with the public "anon" key that ships in the
-- browser bundle. That is acceptable for a one-evening event demo, not for production.
-- Vote casting and demo reset go through functions so their rules are enforced here,
-- in the database, not just in the browser.

-- One row per guest whose status changed at the event (overrides the guest list).
create table if not exists public.check_ins (
  guest_id   text primary key,
  checked_in boolean not null,
  at         timestamptz,
  updated_at timestamptz not null default now()
);

-- Walk-in guests, stored as the same JSON the app creates (validated again when read).
create table if not exists public.walk_ins (
  id         text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

-- Exactly one row (id = 1): which poll is on screen, whether voting is open, the round.
create table if not exists public.poll_state (
  id             int primary key default 1 check (id = 1),
  active_poll_id text,
  is_open        boolean not null default false,
  voting_round   text not null default 'initial'
);
insert into public.poll_state (id) values (1) on conflict (id) do nothing;

-- One row per vote. Counts are computed by the app (a few hundred rows at most).
create table if not exists public.votes (
  id           bigint generated always as identity primary key,
  poll_id      text not null,
  option_index int  not null check (option_index >= 0),
  created_at   timestamptz not null default now()
);

-- Casts a vote only if that poll is the active one and voting is open.
-- Returns 'ok' or 'closed'. Checking and inserting in one statement avoids a race with
-- the organizer closing the poll.
create or replace function public.cast_vote(p_poll_id text, p_option_index int)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into votes (poll_id, option_index)
  select p_poll_id, p_option_index
  from poll_state
  where id = 1 and active_poll_id = p_poll_id and is_open;
  if found then
    return 'ok';
  end if;
  return 'closed';
end;
$$;

-- Clears all event data and starts a new voting round, in one transaction.
create or replace function public.reset_demo(p_voting_round text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from check_ins where true;
  delete from walk_ins where true;
  delete from votes where true;
  update poll_state set active_poll_id = null, is_open = false, voting_round = p_voting_round
  where id = 1;
$$;

-- Row Level Security on, with open demo policies (see the security note above).
alter table public.check_ins  enable row level security;
alter table public.walk_ins   enable row level security;
alter table public.poll_state enable row level security;
alter table public.votes      enable row level security;

drop policy if exists "demo read/write check_ins" on public.check_ins;
create policy "demo read/write check_ins" on public.check_ins
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "demo read/write walk_ins" on public.walk_ins;
create policy "demo read/write walk_ins" on public.walk_ins
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "demo read poll_state" on public.poll_state;
create policy "demo read poll_state" on public.poll_state
  for select to anon, authenticated using (true);
drop policy if exists "demo update poll_state" on public.poll_state;
create policy "demo update poll_state" on public.poll_state
  for update to anon, authenticated using (true) with check (true);

-- Votes can be read but only *added* through cast_vote (no direct inserts or edits).
drop policy if exists "demo read votes" on public.votes;
create policy "demo read votes" on public.votes
  for select to anon, authenticated using (true);

grant select, insert, update, delete on public.check_ins, public.walk_ins to anon, authenticated;
grant select, update on public.poll_state to anon, authenticated;
grant select on public.votes to anon, authenticated;
grant execute on function public.cast_vote(text, int), public.reset_demo(text) to anon, authenticated;

-- Realtime: broadcast changes on these tables to connected browsers.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['check_ins', 'walk_ins', 'poll_state', 'votes'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
