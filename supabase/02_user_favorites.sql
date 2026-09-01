create table if not exists public.favoritos_usuario (
  user_id uuid not null references auth.users(id) on delete cascade,
  equipo_abreviatura text not null check (length(trim(equipo_abreviatura)) > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, equipo_abreviatura)
);

alter table public.favoritos_usuario enable row level security;

drop policy if exists "Usuarios leen sus favoritos" on public.favoritos_usuario;
drop policy if exists "Usuarios agregan sus favoritos" on public.favoritos_usuario;
drop policy if exists "Usuarios eliminan sus favoritos" on public.favoritos_usuario;

create policy "Usuarios leen sus favoritos"
  on public.favoritos_usuario
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios agregan sus favoritos"
  on public.favoritos_usuario
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuarios eliminan sus favoritos"
  on public.favoritos_usuario
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.favoritos_usuario to authenticated;
