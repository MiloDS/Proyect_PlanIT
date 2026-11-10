-- PlanIt: editar un plan y sus lugares en un solo paso

-- Actualiza el título, la fecha y los lugares en la misma transacción: si algo falla el plan
-- queda como estaba. Es security invoker, así que RLS decide quién puede editar: solo el
-- dueño ve su plan en un update, y los lugares los puede cambiar cualquier miembro.
create function public.update_plan(
  p_plan_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_place_ids text[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.plans
  set title = trim(p_title), starts_at = p_starts_at
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
  insert into public.plan_places (plan_id, place_id, sort_order)
  select p_plan_id, places.place_id, min(places.position) - 1
  from unnest(coalesce(p_place_ids, '{}')) with ordinality as places (place_id, position)
  group by places.place_id
  on conflict (plan_id, place_id) do update set sort_order = excluded.sort_order;
end;
$$;

revoke execute on function public.update_plan(uuid, text, timestamptz, text[]) from public, anon;
grant execute on function public.update_plan(uuid, text, timestamptz, text[]) to authenticated;
