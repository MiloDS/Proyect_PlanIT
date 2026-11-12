-- PlanIt: unirse a un plan con un código (o su QR)

-- Código de 8 caracteres sin los que se confunden al leerlos o dictarlos (0/O, 1/I/L). Sale de
-- gen_random_uuid, que usa el generador seguro de Postgres; con 31^8 combinaciones (unos
-- 850 000 millones) no se puede adivinar uno. Es security definer para comprobar que no se
-- repita entre todos los planes, no solo entre los que RLS deja ver a quien lo pide.
create function private.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_code text;
  v_index integer;
begin
  loop
    v_bytes := uuid_send(gen_random_uuid());
    v_code := '';
    -- Bytes completamente aleatorios del UUID (el 6 y el 8 llevan la versión y la variante)
    foreach v_index in array array[0, 1, 2, 3, 4, 5, 10, 11] loop
      v_code := v_code || substr(v_alphabet, get_byte(v_bytes, v_index) % 31 + 1, 1);
    end loop;
    exit when not exists (select 1 from public.plans where invite_code = v_code);
  end loop;
  return v_code;
end;
$$;

grant execute on function private.generate_invite_code() to authenticated;

-- Los planes que ya existen también reciben su código
alter table public.plans add column invite_code text;
update public.plans set invite_code = private.generate_invite_code() where invite_code is null;
alter table public.plans
  alter column invite_code set default private.generate_invite_code(),
  alter column invite_code set not null,
  add constraint plans_invite_code_key unique (invite_code);

-- Cualquier persona con sesión que tenga el código entra como invitada. Es security definer
-- porque quien se une todavía no es miembro y RLS no le dejaría ver el plan. Acepta el código
-- con o sin guion y en minúsculas. Si la persona ya estaba, no cambia nada.
create function public.join_plan_by_code(p_code text)
returns table (plan_id uuid, already_member boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
begin
  if v_user_id is null then
    raise exception 'Inicia sesión para unirte a un plan'
      using errcode = '42501';
  end if;

  select id into v_plan_id
  from public.plans
  where invite_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  if v_plan_id is null then
    raise exception 'No hay ningún plan con ese código'
      using errcode = 'P0002';
  end if;

  insert into public.plan_members (plan_id, user_id)
  values (v_plan_id, v_user_id)
  on conflict on constraint plan_members_pkey do nothing;

  plan_id := v_plan_id;
  already_member := not found;
  return next;
end;
$$;

-- Solo el dueño cambia el código; el anterior deja de servir. Es security invoker: RLS solo
-- deja actualizar el plan a su dueño.
create function public.regenerate_plan_invite_code(p_plan_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code text;
begin
  update public.plans
  set invite_code = private.generate_invite_code()
  where id = p_plan_id
  returning invite_code into v_code;

  if v_code is null then
    raise exception 'Solo el dueño del plan puede cambiar el código'
      using errcode = '42501';
  end if;
  return v_code;
end;
$$;

revoke execute on function public.join_plan_by_code(text) from public, anon;
grant execute on function public.join_plan_by_code(text) to authenticated;
revoke execute on function public.regenerate_plan_invite_code(uuid) from public, anon;
grant execute on function public.regenerate_plan_invite_code(uuid) to authenticated;
