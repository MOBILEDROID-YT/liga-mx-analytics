create table if not exists public.liguilla_partidos (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  fase text not null check (fase in ('cuartos', 'semifinal', 'final')),
  serie smallint,
  tramo text not null check (tramo in ('ida', 'vuelta', 'unico')),
  local text not null,
  visitante text not null,
  fecha_hora_mx timestamptz,
  goles_local integer,
  goles_visitante integer,
  estado text not null default 'programado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.liguilla_partidos enable row level security;

drop policy if exists "Public can read playoff matches" on public.liguilla_partidos;
drop policy if exists "Admins can manage playoff matches" on public.liguilla_partidos;

create policy "Public can read playoff matches"
  on public.liguilla_partidos
  for select
  to anon, authenticated
  using (true);

create policy "Admins can manage playoff matches"
  on public.liguilla_partidos
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.liguilla_partidos to anon, authenticated;
grant insert, update, delete on public.liguilla_partidos to authenticated;
