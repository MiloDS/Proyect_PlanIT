-- PlanIt: esquema inicial (perfiles, favoritos y planes compartidos)
-- Los lugares vienen de una API externa: aquí solo se guarda su identificador (place_id).

-- Funciones auxiliares que no deben quedar expuestas por la API de Supabase
create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Nombre y foto públicos de cada usuario
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lugares guardados por cada usuario
create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  place_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  starts_at timestamptz not null,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plans_owner_id_idx on public.plans (owner_id);
create index plans_starts_at_idx on public.plans (starts_at);

create table public.plan_members (
  plan_id uuid not null references public.plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create index plan_members_user_id_idx on public.plan_members (user_id);

create table public.plan_places (
  plan_id uuid not null references public.plans (id) on delete cascade,
  place_id text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (plan_id, place_id)
);

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------

-- Las políticas de plan_members consultan plan_members: con security definer
-- la consulta no vuelve a pasar por RLS y se evita la recursión infinita
create function private.is_plan_member(p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.plan_members
    where plan_id = p_plan_id
      and user_id = (select auth.uid())
  );
$$;

create function private.is_plan_owner(p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.plans
    where id = p_plan_id
      and owner_id = (select auth.uid())
  );
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- El dueño queda como miembro para que las políticas por membresía lo incluyan
create function private.add_plan_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.plan_members (plan_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

-- Crea el perfil al registrarse (correo o Google) con los datos de user_metadata.
-- Va en public porque el trigger lo ejecuta el rol de Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Invitar a un plan por correo: el cliente no puede consultar auth.users
create function public.add_plan_member_by_email(p_plan_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if not private.is_plan_owner(p_plan_id) then
    raise exception 'Solo el dueño del plan puede invitar personas'
      using errcode = '42501';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email));

  if v_user_id is null then
    raise exception 'No hay ningún usuario registrado con ese correo'
      using errcode = 'P0002';
  end if;

  insert into public.plan_members (plan_id, user_id)
  values (p_plan_id, v_user_id)
  on conflict (plan_id, user_id) do nothing;
end;
$$;

revoke execute on function public.add_plan_member_by_email(uuid, text) from public, anon;
grant execute on function public.add_plan_member_by_email(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_plan_created
  after insert on public.plans
  for each row execute function private.add_plan_owner_as_member();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function private.set_updated_at();

-- Perfiles para los usuarios que se registraron antes de esta migración
insert into public.profiles (id, full_name, avatar_url)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.plans enable row level security;
alter table public.plan_members enable row level security;
alter table public.plan_places enable row level security;

-- profiles: visibles para cualquier usuario autenticado (avatares de los planes)
create policy "Authenticated users can view profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- favorites: cada usuario solo ve y modifica los suyos
create policy "Users can view their own favorites"
  on public.favorites for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their own favorites"
  on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can remove their own favorites"
  on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

-- plans: los miembros ven el plan; solo el dueño lo edita o elimina
create policy "Members can view their plans"
  on public.plans for select to authenticated
  using (owner_id = (select auth.uid()) or private.is_plan_member(id));

create policy "Users can create their own plans"
  on public.plans for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners can update their plans"
  on public.plans for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners can delete their plans"
  on public.plans for delete to authenticated
  using (owner_id = (select auth.uid()));

-- plan_members: el dueño invita y expulsa; cualquier miembro puede salirse
create policy "Members can view the members of their plans"
  on public.plan_members for select to authenticated
  using (private.is_plan_member(plan_id));

create policy "Owners can add members"
  on public.plan_members for insert to authenticated
  with check (role = 'member' and private.is_plan_owner(plan_id));

create policy "Owners can remove members and members can leave"
  on public.plan_members for delete to authenticated
  using (role = 'member' and (private.is_plan_owner(plan_id) or user_id = (select auth.uid())));

-- plan_places: cualquier miembro organiza los lugares del plan
create policy "Members can view the places of their plans"
  on public.plan_places for select to authenticated
  using (private.is_plan_member(plan_id));

create policy "Members can add places to their plans"
  on public.plan_places for insert to authenticated
  with check (private.is_plan_member(plan_id));

create policy "Members can reorder the places of their plans"
  on public.plan_places for update to authenticated
  using (private.is_plan_member(plan_id))
  with check (private.is_plan_member(plan_id));

create policy "Members can remove places from their plans"
  on public.plan_places for delete to authenticated
  using (private.is_plan_member(plan_id));
