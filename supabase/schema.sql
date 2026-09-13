-- nimoh — database schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is written to be re-runnable: every statement is guarded, so applying it a
-- second time changes nothing.
--
-- Three tables, all keyed by auth.uid(). Row level security is the only thing
-- standing between one user's cycle data and another's, so every table has it
-- enabled and every policy checks ownership on both read and write.

-- ---------------------------------------------------------------------------
-- profiles — one row per user, created automatically on sign up
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users on delete cascade,
  name               text        not null default '',
  avatar_url         text,
  birth_year         integer,
  goal               text        not null default 'track',
  cycle_length       integer     not null default 28,
  period_length      integer     not null default 5,
  reminders          boolean     not null default true,
  remind_days_before integer     not null default 2,
  tour_seen          boolean     not null default false,
  updated_at         timestamptz not null default now(),

  constraint profiles_goal_check check (goal in ('track', 'conceive', 'avoid')),
  constraint profiles_cycle_length_check check (cycle_length between 18 and 45),
  constraint profiles_period_length_check check (period_length between 1 and 12),
  constraint profiles_remind_check check (remind_days_before between 0 and 7)
);

-- ---------------------------------------------------------------------------
-- periods — one row per tracked period
-- ---------------------------------------------------------------------------
create table if not exists public.periods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  start_date date        not null,
  end_date   date,
  created_at timestamptz not null default now(),

  constraint periods_order_check check (end_date is null or end_date >= start_date),
  -- A period is identified by the day it began, so the same start cannot be
  -- recorded twice. This is also what makes upsert-on-start safe.
  unique (user_id, start_date)
);

create index if not exists periods_user_start_idx
  on public.periods (user_id, start_date);

-- ---------------------------------------------------------------------------
-- logs — one row per logged day
-- ---------------------------------------------------------------------------
create table if not exists public.logs (
  user_id    uuid        not null references auth.users on delete cascade,
  log_date   date        not null,
  flow       text,
  moods      text[]      not null default '{}',
  symptoms   text[]      not null default '{}',
  notes      text        not null default '',
  water      integer     not null default 0,
  updated_at timestamptz not null default now(),

  primary key (user_id, log_date),
  constraint logs_flow_check
    check (flow is null or flow in ('spotting', 'light', 'medium', 'heavy')),
  constraint logs_water_check check (water between 0 and 8)
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.periods  enable row level security;
alter table public.logs     enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_own_row') then
    create policy profiles_own_row on public.profiles
      for all to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'periods' and policyname = 'periods_own_rows') then
    create policy periods_own_rows on public.periods
      for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'logs' and policyname = 'logs_own_rows') then
    create policy logs_own_rows on public.logs
      for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- A profile row on sign up
--
-- The app reads the profile immediately after the session appears, so it has to
-- exist by then — a trigger is the only place that is guaranteed, whether the
-- account came from the email form or from Google.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      ''
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists logs_touch on public.logs;
create trigger logs_touch before update on public.logs
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- avatars — profile photos
--
-- One public bucket. Every object lives under a folder named after the user's
-- id, and the policies below key off that first path segment, so a signed-in
-- user can only write inside her own folder no matter what path the client asks
-- for. Reads are public because the app renders the URL straight into an
-- <Image>, which carries no auth header.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'avatars_public_read') then
    create policy avatars_public_read on storage.objects
      for select to public
      using (bucket_id = 'avatars');
  end if;

  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'avatars_own_folder_insert') then
    create policy avatars_own_folder_insert on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'avatars_own_folder_update') then
    create policy avatars_own_folder_update on storage.objects
      for update to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'avatars_own_folder_delete') then
    create policy avatars_own_folder_delete on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
