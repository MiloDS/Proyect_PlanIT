-- PlanIt: planes favoritos y creación de planes con sus lugares en un solo paso

-- ---------------------------------------------------------------------------
-- Planes favoritos (pestaña "Planes" de Favoritos)
-- ---------------------------------------------------------------------------

create table public.favorite_plans (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, plan_id)
);

create index favorite_plans_plan_id_idx on public.favorite_plans (plan_id);

alter table public.favorite_plans enable row level security;

-- Si el usuario sale del plan, su favorito deja de verse aunque la fila siga existiendo
create policy "Members can view their favorite plans"
  on public.favorite_plans for select to authenticated
  using (user_id = (select auth.uid()) and private.is_plan_member(plan_id));

create policy "Members can add plans to their favorites"
  on public.favorite_plans for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_plan_member(plan_id));

create policy "Users can remove their favorite plans"
  on public.favorite_plans for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Crear un plan con sus lugares
-- ---------------------------------------------------------------------------

-- Inserta el plan y sus lugares en la misma transacción: si algo falla no queda un plan
-- a medias. Es security invoker, así que las políticas de RLS se aplican igual que si la
-- app hiciera los inserts por su cuenta (el trigger on_plan_created agrega al dueño).
create function public.create_plan(p_title text, p_starts_at timestamptz, p_place_ids text[])
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plan_id uuid;
begin
  insert into public.plans (title, starts_at)
  values (trim(p_title), p_starts_at)
  returning id into v_plan_id;

  insert into public.plan_places (plan_id, place_id, sort_order)
  select v_plan_id, places.place_id, places.position - 1
  from unnest(coalesce(p_place_ids, '{}')) with ordinality as places (place_id, position)
  on conflict (plan_id, place_id) do nothing;

  return v_plan_id;
end;
$$;

revoke execute on function public.create_plan(text, timestamptz, text[]) from public, anon;
grant execute on function public.create_plan(text, timestamptz, text[]) to authenticated;
