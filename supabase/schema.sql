-- Run in the Supabase SQL editor to enable profiles and username/password auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bird text,
  primary_clinic_id text,
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text,
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists bird text,
  add column if not exists primary_clinic_id text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_username_unique
  on public.profiles (username)
  where username is not null;

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

create table if not exists public.usernames (
  username text primary key
    check (username ~ '^[a-z0-9_]{3,24}$'),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.usernames enable row level security;
revoke all on public.usernames from anon, authenticated;
grant all on public.usernames to service_role;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
