alter table public.tips
  add column if not exists resultado text;

alter table public.tips
  add column if not exists resultado_actualizado_en timestamptz;

drop view if exists public.tips_historial;

create view public.tips_historial as
select
  tips_completos.id,
  tips_completos.jornada,
  tips_completos.local,
  tips_completos.visitante,
  tips_completos.categoria,
  tips_completos.tipo_apuesta,
  tips_completos.prediccion,
  tips_completos.confianza,
  tips_completos.razonamiento,
  tips.partido_id,
  tips.resultado,
  tips.resultado_actualizado_en,
  partidos.estado as estado_partido,
  partidos.goles_local,
  partidos.goles_visitante,
  tips.created_at as tip_creado_en
from public.tips_completos
left join public.tips on public.tips.id = public.tips_completos.id
left join public.partidos on public.partidos.id = public.tips.partido_id;

grant select on public.tips_historial to anon, authenticated;

select
  id,
  partido_id,
  categoria,
  prediccion,
  resultado
from public.tips
order by created_at desc;

