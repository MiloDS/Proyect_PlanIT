-- PlanIt: organizador de planes (tiempo en cada lugar, transporte, presupuesto y notas)

-- Cómo se mueve el grupo entre lugares: decide los tiempos de traslado del itinerario
alter table public.plans
  add column transport_mode text not null default 'walk'
    check (transport_mode in ('walk', 'drive', 'transit')),
  -- Presupuesto aproximado por persona, en pesos colombianos
  add column budget_per_person integer check (budget_per_person between 0 and 10000000),
  add column notes text check (char_length(notes) <= 500);

-- Cuánto tiempo se quedan en cada lugar; con los traslados da la hora de llegada a cada uno
alter table public.plan_places
  add column stay_minutes integer not null default 60 check (stay_minutes between 5 and 720);

-- create_plan y update_plan reciben los datos nuevos. Los parámetros nuevos tienen valores por
-- defecto para que la versión anterior de la app pueda seguir guardando planes.
drop function public.create_plan(text, timestamptz, text[]);
drop function public.update_plan(uuid, text, timestamptz, text[]);

-- p_stay_minutes va en el mismo orden que p_place_ids (60 minutos si falta)
create function public.create_plan(
  p_title text,
  p_starts_at timestamptz,
  p_place_ids text[],
  p_stay_minutes integer[] default null,
  p_transport_mode text default 'walk',
  p_budget_per_person integer default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plan_id uuid;
begin
  insert into public.plans (title, starts_at, transport_mode, budget_per_person, notes)
  values (
    trim(p_title),
    p_starts_at,
    coalesce(p_transport_mode, 'walk'),
    p_budget_per_person,
    nullif(trim(p_notes), '')
  )
  returning id into v_plan_id;

  insert into public.plan_places (plan_id, place_id, sort_order, stay_minutes)
  select v_plan_id, stops.place_id, stops.position - 1, coalesce(stops.stay_minutes, 60)
  from unnest(coalesce(p_place_ids, '{}'), coalesce(p_stay_minutes, '{}'))
    with ordinality as stops (place_id, stay_minutes, position)
  where stops.place_id is not null
  on conflict (plan_id, place_id) do nothing;

  return v_plan_id;
end;
$$;

-- Igual que antes: security invoker, así que RLS solo deja editar al dueño
create function public.update_plan(
  p_plan_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_place_ids text[],
  p_stay_minutes integer[] default null,
  p_transport_mode text default 'walk',
  p_budget_per_person integer default null,
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.plans
  set title = trim(p_title),
    starts_at = p_starts_at,
    transport_mode = coalesce(p_transport_mode, 'walk'),
    budget_per_person = p_budget_per_person,
    notes = nullif(trim(p_notes), '')
  where id = p_plan_id;

  -- RLS oculta el plan a quien no es el dueño: el update no encuentra la fila
  if not found then
    raise exception 'Solo el dueño del plan puede editarlo'
      using errcode = '42501';
  end if;

  delete from public.plan_places
  where plan_id = p_plan_id
    and place_id <> all (coalesce(p_place_ids, '{}'));

  -- Si un lugar viene repetido se queda con su primera posición
  insert into public.plan_places (plan_id, place_id, sort_order, stay_minutes)
  select p_plan_id, stops.place_id, min(stops.position) - 1,
    coalesce((array_agg(stops.stay_minutes order by stops.position))[1], 60)
  from unnest(coalesce(p_place_ids, '{}'), coalesce(p_stay_minutes, '{}'))
    with ordinality as stops (place_id, stay_minutes, position)
  where stops.place_id is not null
  group by stops.place_id
  on conflict (plan_id, place_id) do update
    set sort_order = excluded.sort_order, stay_minutes = excluded.stay_minutes;
end;
$$;

-- Agrega un lugar al final de un plan desde la ficha del lugar. Devuelve false si el lugar ya
-- estaba. Es security invoker: RLS decide quién puede agregar (los miembros del plan).
create function public.add_plan_place(p_plan_id uuid, p_place_id text, p_stay_minutes integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.plans where id = p_plan_id) then
    raise exception 'El plan no existe o no eres miembro'
      using errcode = '42501';
  end if;

  insert into public.plan_places (plan_id, place_id, sort_order, stay_minutes)
  select p_plan_id, p_place_id, coalesce(max(sort_order) + 1, 0), coalesce(p_stay_minutes, 60)
  from public.plan_places
  where plan_id = p_plan_id
  on conflict (plan_id, place_id) do nothing;

  return found;
end;
$$;

revoke execute on function public.create_plan(text, timestamptz, text[], integer[], text, integer, text)
  from public, anon;
grant execute on function public.create_plan(text, timestamptz, text[], integer[], text, integer, text)
  to authenticated;
revoke execute on function public.update_plan(uuid, text, timestamptz, text[], integer[], text, integer, text)
  from public, anon;
grant execute on function public.update_plan(uuid, text, timestamptz, text[], integer[], text, integer, text)
  to authenticated;
revoke execute on function public.add_plan_place(uuid, text, integer) from public, anon;
grant execute on function public.add_plan_place(uuid, text, integer) to authenticated;
