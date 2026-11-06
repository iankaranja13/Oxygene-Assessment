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

-- Polls the organizer creates on the dashboard (the seed polls ship with the app).
create table if not exists public.polls (
  id         text primary key check (id like 'custom-%'),
  question   text not null check (char_length(question) between 1 and 200),
  options    jsonb not null check (jsonb_typeof(options) = 'array'
                                   and jsonb_array_length(options) between 2 and 6),
  created_at timestamptz not null default now()
);

-- Every valid guest check-in code, loaded by scripts/sync-guest-codes.mjs.
-- PRIVATE: no policies and no grants, so phones can never read it. They can only ask
-- verify_attendee_code / cast_vote, which run with the owner's rights.
create table if not exists public.guest_codes (
  code text primary key
);

-- Which code voted in which poll: one row per (poll, code) is what makes it
-- "one vote per guest". PRIVATE like guest_codes, and deliberately not in the votes
-- table, which phones can read and Realtime broadcasts.
create table if not exists public.poll_voters (
  poll_id    text not null,
  voter_code text not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, voter_code)
);

-- Older version took (poll, option) with no code; remove it so only the coded one exists.
drop function if exists public.cast_vote(text, int);

-- true if the code belongs to a guest. Codes are normalized by the app (e.g. "OXY-1049").
create or replace function public.verify_attendee_code(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from guest_codes where code = p_code);
$$;

-- Casts one vote for a guest code. Returns:
--   'ok', 'invalid-code' (not a guest), 'closed' (poll not active/open),
--   'already-voted' (this code already voted in this poll).
create or replace function public.cast_vote(p_poll_id text, p_option_index int, p_voter_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_option_index is null or p_option_index < 0 then
    return 'invalid-option';
  end if;
  if not exists (select 1 from guest_codes where code = p_voter_code) then
    return 'invalid-code';
  end if;
  if not exists (
    select 1 from poll_state where id = 1 and active_poll_id = p_poll_id and is_open
  ) then
    return 'closed';
  end if;
  -- The primary key makes a second vote from the same code a no-op.
  insert into poll_voters (poll_id, voter_code) values (p_poll_id, p_voter_code)
  on conflict do nothing;
  if not found then
    return 'already-voted';
  end if;
  insert into votes (poll_id, option_index) values (p_poll_id, p_option_index);
  return 'ok';
end;
$$;

-- Deletes an organizer-created poll, but only if it has no votes and isn't on screen,
-- so results are never lost. Returns 'ok', 'active' or 'has-votes'.
create or replace function public.delete_custom_poll(p_poll_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from poll_state where id = 1 and active_poll_id = p_poll_id) then
    return 'active';
  end if;
  if exists (select 1 from votes where poll_id = p_poll_id) then
    return 'has-votes';
  end if;
  delete from polls where id = p_poll_id;
  return 'ok';
end;
$$;

-- Clears all event activity and starts a new voting round, in one transaction.
-- Organizer-created polls are kept (they're prepared content, not activity).
create or replace function public.reset_demo(p_voting_round text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from check_ins where true;
  delete from walk_ins where true;
  delete from votes where true;
  delete from poll_voters where true;
  update poll_state set active_poll_id = null, is_open = false, voting_round = p_voting_round
  where id = 1;
$$;

-- Row Level Security on, with open demo policies (see the security note above).
alter table public.check_ins  enable row level security;
alter table public.walk_ins   enable row level security;
alter table public.poll_state enable row level security;
alter table public.votes      enable row level security;
alter table public.polls       enable row level security;
alter table public.guest_codes enable row level security;
alter table public.poll_voters enable row level security;

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
drop policy if exists "demo read polls" on public.polls;
create policy "demo read polls" on public.polls
  for select to anon, authenticated using (true);
drop policy if exists "demo create polls" on public.polls;
create policy "demo create polls" on public.polls
  for insert to anon, authenticated with check (true);

grant select, insert on public.polls to anon, authenticated;
-- guest_codes and poll_voters: no policies and no grants on purpose (private).
revoke all on public.guest_codes, public.poll_voters from anon, authenticated;

grant execute on function
  public.verify_attendee_code(text),
  public.cast_vote(text, int, text),
  public.delete_custom_poll(text),
  public.reset_demo(text)
  to anon, authenticated;

-- Realtime: broadcast changes on these tables to connected browsers.
do $$
declare
  table_name text;
begin
  -- guest_codes and poll_voters are never broadcast.
  foreach table_name in array array['check_ins', 'walk_ins', 'poll_state', 'votes', 'polls'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
