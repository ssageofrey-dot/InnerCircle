-- Run this once in Supabase: SQL Editor > New query.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  member_id text not null unique default ('IC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  contribution_month date not null,
  status text not null default 'pending' check (status in ('pending', 'verified')),
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (member_id, contribution_month)
);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'phone', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

alter table public.profiles enable row level security;
alter table public.contributions enable row level security;

create policy "Members view own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Active members view own contributions" on public.contributions for select to authenticated using (
  member_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and status = 'active')
);
create policy "Admins manage contributions" on public.contributions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- After creating and confirming your first account, run this once to promote it:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
