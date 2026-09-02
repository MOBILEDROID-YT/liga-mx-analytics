create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.tips enable row level security;
drop policy if exists "Public can read tips" on public.tips;
drop policy if exists "Admins can update tips" on public.tips;

create policy "Public can read tips"
  on public.tips
  for select
  to anon, authenticated
  using (true);

create policy "Admins can update tips"
  on public.tips
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.tips to anon, authenticated;
grant update on public.tips to authenticated;

alter table public.partidos enable row level security;
drop policy if exists "Public can read matches" on public.partidos;
drop policy if exists "Admins can update matches" on public.partidos;

create policy "Public can read matches"
  on public.partidos
  for select
  to anon, authenticated
  using (true);

create policy "Admins can update matches"
  on public.partidos
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.partidos to anon, authenticated;
grant update on public.partidos to authenticated;

select id, email
from auth.users
order by created_at;

insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('mobiledroidmx@gmail.com')
on conflict (user_id) do nothing;

select admin_users.user_id, auth.users.email
from public.admin_users
join auth.users on auth.users.id = admin_users.user_id
where lower(auth.users.email) = lower('mobiledroidmx@gmail.com');
