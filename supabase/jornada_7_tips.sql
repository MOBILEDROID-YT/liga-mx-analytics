with propuestas(local_busqueda, visitante_busqueda, categoria, tipo_apuesta, prediccion, confianza, razonamiento) as (
  values
    ('puebla', 'toluca', 'base', 'Doble oportunidad', 'Empate o Toluca', 85, 'Toluca tiene argumentos para competir; se cubre el empate y la visita.'),
    ('juarez', 'pachuca', 'zona_gris', 'Total de goles', 'Over de 1.5 goles', 55, 'Se espera un partido con al menos dos goles.'),
    ('san luis', 'chivas', 'base', '1X2', 'Gana Chivas', 70, 'Lectura principal: Chivas gana. El 70% es el complemento del riesgo de empate del 30%.'),
    ('san luis', 'chivas', 'sorpresa', '1X2', 'Empate', 30, 'Riesgo de empate identificado como posible sorpresa.'),
    ('queretaro', 'rayados', 'zona_gris', 'Total de corners', 'Over de 8 corners', 55, 'Se espera un partido con ritmo y mas de ocho corners.'),
    ('queretaro', 'rayados', 'sorpresa', 'Doble oportunidad', 'Queretaro o empate', 30, 'Riesgo de victoria local o empate como escenario sorpresa.'),
    ('tigres', 'necaxa', 'base', 'Doble oportunidad', 'Gana Tigres o empate', 70, 'Tigres parte con ventaja y se cubre el empate.'),
    ('america', 'tijuana', 'zona_gris', 'Total de goles', 'Over de 2.5 goles', 65, 'Se espera un partido abierto con tres o mas goles.'),
    ('atlas', 'atlante', 'base', 'Resultado + total de goles', 'Gana Atlas y over de 1.5 goles', 75, 'Lectura principal: Atlas gana y el partido supera 1.5 goles. El 75% es el complemento del riesgo sorpresa del 25%.'),
    ('atlas', 'atlante', 'sorpresa', '1X2', 'Empate', 25, 'Posible empate de Atlante como escenario sorpresa.'),
    ('pumas', 'leon', 'zona_gris', 'Total de corners', 'Over de 8 corners', 60, 'Se espera un partido con ritmo y mas de ocho corners.'),
    ('pumas', 'leon', 'zona_gris', 'Total de goles', 'Over de 1.5 goles', 60, 'Se esperan al menos dos goles.'),
    ('cruz azul', 'santos', 'base', 'Resultado + total de goles', 'Gana Cruz Azul y over de 1.5 goles', 82, 'Cruz Azul parte como favorito y se esperan al menos dos goles.')
), partidos_j7 as (
  select
    id,
    jornada,
    local,
    visitante,
    translate(lower(coalesce(local, '')), 'áéíóúüñ', 'aeiouun') as local_norm,
    translate(lower(coalesce(visitante, '')), 'áéíóúüñ', 'aeiouun') as visitante_norm
  from public.calendario_completo
  where jornada = 7
), coincidencias as (
  select distinct on (p.local_busqueda, p.visitante_busqueda, p.prediccion)
    m.id as partido_id,
    p.categoria,
    p.tipo_apuesta,
    p.prediccion,
    p.confianza,
    p.razonamiento
  from propuestas p
  join partidos_j7 m
    on m.local_norm like '%' || p.local_busqueda || '%'
   and m.visitante_norm like '%' || p.visitante_busqueda || '%'
  order by p.local_busqueda, p.visitante_busqueda, p.prediccion, m.id
)
insert into public.tips (partido_id, categoria, tipo_apuesta, prediccion, confianza, razonamiento, es_premium)
select
  c.partido_id,
  c.categoria,
  c.tipo_apuesta,
  c.prediccion,
  c.confianza,
  c.razonamiento,
  false
from coincidencias c
where not exists (
  select 1
  from public.tips existing
  where existing.partido_id = c.partido_id
    and lower(trim(existing.prediccion)) = lower(trim(c.prediccion))
)
returning id, partido_id, categoria, prediccion, confianza;
