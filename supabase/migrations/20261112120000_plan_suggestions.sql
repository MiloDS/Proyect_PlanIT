-- PlanIt: sugerencias de cambios a un plan
-- Solo quien creó el plan lo modifica. Los invitados proponen cambios concretos (fecha, lugares,
-- transporte...) y el creador los acepta, y se aplican solos, o los rechaza.

-- ---------------------------------------------------------------------------
-- Los lugares del plan también son solo del dueño
-- ---------------------------------------------------------------------------

-- Hasta ahora cualquier miembro podía agregar, quitar o reordenar lugares desde la API, aunque
-- la app no lo ofreciera. Ahora un invitado lo hace con una sugerencia.
drop policy "Members can add places to their plans" on public.plan_places;
drop policy "Members can reorder the places of their plans" on public.plan_places;
drop policy "Members can remove places from their plans" on public.plan_places;

create policy "Owners can add places to their plans"
  on public.plan_places for insert to authenticated
  with check (private.is_plan_owner(plan_id));

create policy "Owners can change the places of their plans"
  on public.plan_places for update to authenticated
  using (private.is_plan_owner(plan_id))
  with check (private.is_plan_owner(plan_id));

create policy "Owners can remove places from their plans"
  on public.plan_places for delete to authenticated
  using (private.is_plan_owner(plan_id));

-- Mismo comportamiento, con un mensaje claro para quien no es el dueño
create or replace function public.add_plan_place(p_plan_id uuid, p_place_id text, p_stay_minutes integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_plan_owner(p_plan_id) then
    raise exception 'Solo el dueño del plan puede agregar lugares'
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

-- ---------------------------------------------------------------------------
-- Sugerencias
-- ---------------------------------------------------------------------------

-- Cada sugerencia guarda solo lo que cambia: changed_fields dice qué columnas aplicar. Así se
-- distingue "no tocó el presupuesto" (no está en la lista) de "quitar el presupuesto" (está
-- en la lista y vale null). Las reglas de cada dato son las mismas de plans y plan_places.
create table public.plan_suggestions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  message text check (char_length(message) <= 300),
  changed_fields text[] not null check (
    cardinality(changed_fields) > 0
    and changed_fields <@ array['title', 'starts_at', 'transport_mode', 'budget_per_person', 'notes', 'places']
  ),
  title text check (char_length(trim(title)) between 1 and 100),
  starts_at timestamptz,
  transport_mode text check (transport_mode in ('walk', 'drive', 'transit')),
  budget_per_person integer check (budget_per_person between 0 and 10000000),
  notes text check (char_length(notes) <= 500),
  -- El recorrido completo propuesto, en orden, con los minutos en cada lugar
  place_ids text[] check (array_position(place_ids, null) is null),
  stay_minutes integer[] check (
    array_position(stay_minutes, null) is null
    and 5 <= all (stay_minutes)
    and 720 >= all (stay_minutes)
  ),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check ('title' <> all (changed_fields) or title is not null),
  check ('starts_at' <> all (changed_fields) or starts_at is not null),
  check ('transport_mode' <> all (changed_fields) or transport_mode is not null),
  check ('places' <> all (changed_fields) or place_ids is not null),
  check ((place_ids is null) = (stay_minutes is null)),
  check (cardinality(place_ids) = cardinality(stay_minutes)),
  check ((status = 'pending') = (resolved_at is null))
);

create index plan_suggestions_plan_id_idx on public.plan_suggestions (plan_id);
create index plan_suggestions_author_id_idx on public.plan_suggestions (author_id);

-- Una sugerencia pendiente por persona en cada plan: para proponer otra cosa, retira la anterior
create unique index plan_suggestions_one_pending_idx
  on public.plan_suggestions (plan_id, author_id)
  where status = 'pending';

alter table public.plan_suggestions enable row level security;

-- Todo el grupo ve las sugerencias, así nadie propone lo mismo dos veces
create policy "Members can view the suggestions of their plans"
  on public.plan_suggestions for select to authenticated
  using (private.is_plan_member(plan_id));

-- Sugiere un invitado, a su nombre; el dueño no se sugiere a sí mismo, edita el plan
create policy "Guests can suggest changes"
  on public.plan_suggestions for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'pending'
    and private.is_plan_member(plan_id)
    and not private.is_plan_owner(plan_id)
  );

-- El dueño responde (lo hacen accept_plan_suggestion y reject_plan_suggestion)
create policy "Owners can answer suggestions"
  on public.plan_suggestions for update to authenticated
  using (private.is_plan_owner(plan_id))
  with check (private.is_plan_owner(plan_id));

-- Quien sugirió puede retirar su sugerencia mientras siga pendiente
create policy "Authors can withdraw pending suggestions"
  on public.plan_suggestions for delete to authenticated
  using (author_id = (select auth.uid()) and status = 'pending');

-- Si alguien sale del plan o lo quitan, sus sugerencias pendientes se van con él
create function private.delete_pending_suggestions_of_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.plan_suggestions
  where plan_id = old.plan_id
    and author_id = old.user_id
    and status = 'pending';
  return old;
end;
$$;

create trigger on_plan_member_removed
  after delete on public.plan_members
  for each row execute function private.delete_pending_suggestions_of_member();

-- Revisa que la sugerencia exista, siga pendiente y que quien responde sea el dueño
create function private.get_suggestion_to_answer(p_suggestion_id uuid)
returns public.plan_suggestions
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_suggestion public.plan_suggestions;
begin
  select * into v_suggestion
  from public.plan_suggestions
  where id = p_suggestion_id;

  if v_suggestion.id is null then
    raise exception 'Esa sugerencia ya no existe'
      using errcode = 'P0002';
  end if;
  if not private.is_plan_owner(v_suggestion.plan_id) then
    raise exception 'Solo el dueño del plan puede responder sugerencias'
      using errcode = '42501';
  end if;
  if v_suggestion.status <> 'pending' then
    raise exception 'Esa sugerencia ya fue respondida'
      using errcode = '22023';
  end if;
  return v_suggestion;
end;
$$;

grant execute on function private.get_suggestion_to_answer(uuid) to authenticated;

-- Aplica al plan solo los datos que cambia la sugerencia, en una transacción: si algo falla,
-- el plan y la sugerencia quedan como estaban. Es security invoker: RLS confirma que quien
-- la acepta es el dueño (el único que puede actualizar el plan y sus lugares).
create function public.accept_plan_suggestion(p_suggestion_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_suggestion public.plan_suggestions := private.get_suggestion_to_answer(p_suggestion_id);
  v_changed text[] := v_suggestion.changed_fields;
begin
  update public.plans
  set title = case when 'title' = any (v_changed) then trim(v_suggestion.title) else title end,
    starts_at = case when 'starts_at' = any (v_changed) then v_suggestion.starts_at else starts_at end,
    transport_mode = case
      when 'transport_mode' = any (v_changed) then v_suggestion.transport_mode
      else transport_mode
    end,
    budget_per_person = case
      when 'budget_per_person' = any (v_changed) then v_suggestion.budget_per_person
      else budget_per_person
    end,
    notes = case when 'notes' = any (v_changed) then nullif(trim(v_suggestion.notes), '') else notes end
  where id = v_suggestion.plan_id;

  -- Los lugares se reemplazan por el recorrido propuesto, igual que en update_plan
  if 'places' = any (v_changed) then
    delete from public.plan_places
    where plan_id = v_suggestion.plan_id
      and place_id <> all (v_suggestion.place_ids);

    insert into public.plan_places (plan_id, place_id, sort_order, stay_minutes)
    select v_suggestion.plan_id, stops.place_id, min(stops.position) - 1,
      (array_agg(stops.stay_minutes order by stops.position))[1]
    from unnest(v_suggestion.place_ids, v_suggestion.stay_minutes)
      with ordinality as stops (place_id, stay_minutes, position)
    group by stops.place_id
    on conflict (plan_id, place_id) do update
      set sort_order = excluded.sort_order, stay_minutes = excluded.stay_minutes;
  end if;

  update public.plan_suggestions
  set status = 'accepted', resolved_at = now()
  where id = p_suggestion_id;
end;
$$;

create function public.reject_plan_suggestion(p_suggestion_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.get_suggestion_to_answer(p_suggestion_id);

  update public.plan_suggestions
  set status = 'rejected', resolved_at = now()
  where id = p_suggestion_id;
end;
$$;

revoke execute on function public.accept_plan_suggestion(uuid) from public, anon;
grant execute on function public.accept_plan_suggestion(uuid) to authenticated;
revoke execute on function public.reject_plan_suggestion(uuid) from public, anon;
grant execute on function public.reject_plan_suggestion(uuid) to authenticated;
