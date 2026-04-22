-- SkinX Supabase schema. Run in Supabase SQL editor.

-- Profiles: 1-to-1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  age_range text,
  sex text,
  skin_type text,
  risk_factors text[] default '{}',
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scans
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  image_path text not null,
  body_area text,
  notes text,
  risk_score int not null default 0,
  risk_level text not null default 'low', -- low | medium | high
  status text not null default 'stable',  -- stable | review | new
  abcde jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists scans_user_created_idx on public.scans(user_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.scans enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_self_upsert" on public.profiles;
create policy "profiles_self_upsert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "scans_self_all" on public.scans;
create policy "scans_self_all" on public.scans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket: create in Supabase UI named "scans" (private).
-- Storage policies (run once):
-- insert into storage.buckets (id, name, public) values ('scans','scans',false) on conflict do nothing;
-- create policy "scans_user_rw" on storage.objects
--   for all using (bucket_id = 'scans' and auth.uid()::text = (storage.foldername(name))[1])
--   with check (bucket_id = 'scans' and auth.uid()::text = (storage.foldername(name))[1]);
