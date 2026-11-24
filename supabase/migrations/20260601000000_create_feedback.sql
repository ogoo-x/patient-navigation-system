create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  destination text,
  campus text,
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;

revoke all on table public.feedback from anon, authenticated;
grant insert on table public.feedback to anon, authenticated;

drop policy if exists "Guests and users can submit feedback"
  on public.feedback;
create policy "Guests and users can submit feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
