// Prueba las migraciones y las políticas de Row Level Security en un Postgres local (PGlite)
// con una réplica mínima de lo que Supabase ya trae: roles anon/authenticated y auth.uid().
// Uso: npm run test:db
import { readdirSync, readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS_DIR = new URL('./migrations/', import.meta.url);

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c';
const OLD = '00000000-0000-0000-0000-000000000001';

const db = new PGlite();

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`);

// Usuario registrado antes de las migraciones (prueba el backfill de perfiles)
await db.query(
  `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'old@test.com', '{"name":"Old User"}')`,
  [OLD]
);

for (const file of readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith('.sql'))
  .sort()) {
  await db.exec(readFileSync(new URL(file, MIGRATIONS_DIR), 'utf8'));
}

await db.query(
  `insert into auth.users (id, email, raw_user_meta_data) values
     ($1, 'ana@test.com', '{"full_name":"Ana Ruiz"}'),
     ($2, 'beto@test.com', '{"name":"Beto Gil","avatar_url":"https://img/beto.png"}'),
     ($3, 'caro@test.com', '{}')`,
  [A, B, C]
);

let failures = 0;
function check(name, condition, detail = '') {
  console.log(`${condition ? 'OK  ' : 'FAIL'} ${name}${condition ? '' : `  -> ${detail}`}`);
  if (!condition) failures++;
}

async function run(role, userId, sql, params = []) {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    userId ? JSON.stringify({ sub: userId }) : '',
  ]);
  await db.exec(`set role ${role}`);
  try {
    const res = await db.query(sql, params);
    return { rows: res.rows, affected: res.affectedRows ?? 0 };
  } catch (error) {
    return { error: error.message, rows: [], affected: 0 };
  } finally {
    await db.exec('reset role');
  }
}
const as = (userId, sql, params) => run('authenticated', userId, sql, params);
const asAnon = (sql, params) => run('anon', null, sql, params);

// --- Perfiles
const profiles = (await db.query('select id, full_name, avatar_url from public.profiles')).rows;
check('trigger crea perfiles al registrarse', profiles.length === 4, JSON.stringify(profiles));
check(
  'backfill crea perfil a usuarios previos',
  profiles.some((p) => p.id === OLD && p.full_name === 'Old User')
);
check(
  'perfil toma full_name',
  profiles.some((p) => p.id === A && p.full_name === 'Ana Ruiz')
);
check(
  'perfil toma name y avatar_url (Google)',
  profiles.some((p) => p.id === B && p.full_name === 'Beto Gil' && p.avatar_url)
);
check(
  'B no puede editar el perfil de A',
  (await as(B, `update public.profiles set full_name = 'x' where id = $1`, [A])).affected === 0
);
check(
  'B puede editar su perfil',
  (await as(B, `update public.profiles set full_name = 'Beto G.' where id = $1`, [B])).affected ===
    1
);

// --- Planes
const created = await as(
  A,
  `insert into public.plans (title, starts_at) values ('Tarde con amigos', now() + interval '3 days') returning id, owner_id`
);
check(
  'A crea un plan (insert ... returning)',
  !created.error && created.rows[0]?.owner_id === A,
  created.error
);
const planId = created.rows[0]?.id;

const spoof = await as(
  A,
  `insert into public.plans (owner_id, title, starts_at) values ($1, 'x', now())`,
  [B]
);
check('A no puede crear un plan a nombre de B', !!spoof.error, 'se permitió');

const ownerRow = await as(A, `select user_id, role from public.plan_members where plan_id = $1`, [
  planId,
]);
check(
  'el dueño queda como miembro owner',
  ownerRow.rows.length === 1 && ownerRow.rows[0].role === 'owner',
  JSON.stringify(ownerRow)
);

check(
  'A invita a B por correo',
  !(await as(A, `select public.add_plan_member_by_email($1, ' BETO@test.com ')`, [planId])).error
);
const notOwner = await as(B, `select public.add_plan_member_by_email($1, 'caro@test.com')`, [
  planId,
]);
check('B (no dueño) no puede invitar', /dueño/.test(notOwner.error ?? ''), notOwner.error);
const unknown = await as(A, `select public.add_plan_member_by_email($1, 'nadie@test.com')`, [
  planId,
]);
check(
  'invitar un correo inexistente falla',
  /ningún usuario/.test(unknown.error ?? ''),
  unknown.error
);

check('B ve el plan compartido', (await as(B, `select id from public.plans`)).rows.length === 1);
const members = await as(
  B,
  `select m.role, p.full_name from public.plan_members m join public.profiles p on p.id = m.user_id where m.plan_id = $1`,
  [planId]
);
check('B ve los 2 miembros con nombre', members.rows.length === 2, JSON.stringify(members));
check('C no ve el plan', (await as(C, `select id from public.plans`)).rows.length === 0);
check('C no ve los miembros', (await as(C, `select * from public.plan_members`)).rows.length === 0);

check(
  'B agrega un lugar al plan',
  !(
    await as(B, `insert into public.plan_places (plan_id, place_id) values ($1, 'gp_arvi')`, [
      planId,
    ])
  ).error
);
check(
  'C no puede agregar lugares',
  !!(
    await as(C, `insert into public.plan_places (plan_id, place_id) values ($1, 'gp_x')`, [planId])
  ).error
);
check(
  'C no ve los lugares del plan',
  (await as(C, `select * from public.plan_places`)).rows.length === 0
);
check(
  'B reordena lugares',
  (await as(B, `update public.plan_places set sort_order = 2 where plan_id = $1`, [planId]))
    .affected === 1
);

check(
  'B no puede editar el plan',
  (await as(B, `update public.plans set title = 'x' where id = $1`, [planId])).affected === 0
);
const updated = await as(
  A,
  `update public.plans set title = 'Tarde de museo' where id = $1 returning created_at, updated_at`,
  [planId]
);
check(
  'A edita su plan y se actualiza updated_at',
  updated.rows.length === 1 && updated.rows[0].updated_at > updated.rows[0].created_at,
  JSON.stringify(updated)
);

check(
  'B no puede agregar miembros directamente',
  !!(await as(B, `insert into public.plan_members (plan_id, user_id) values ($1, $2)`, [planId, C]))
    .error
);
check(
  'A no puede quitarse como owner',
  (await as(A, `delete from public.plan_members where plan_id = $1 and user_id = $2`, [planId, A]))
    .affected === 0
);
check(
  'B puede salirse del plan',
  (await as(B, `delete from public.plan_members where plan_id = $1 and user_id = $2`, [planId, B]))
    .affected === 1
);
check('B ya no ve el plan', (await as(B, `select id from public.plans`)).rows.length === 0);

// --- Favoritos
check(
  'A guarda un favorito (user_id por defecto)',
  !(await as(A, `insert into public.favorites (place_id) values ('gp_museo')`)).error
);
check(
  'B no ve los favoritos de A',
  (await as(B, `select * from public.favorites`)).rows.length === 0
);
check(
  'B no puede guardar favoritos a nombre de A',
  !!(await as(B, `insert into public.favorites (user_id, place_id) values ($1, 'gp_x')`, [A])).error
);

// --- Crear plan con lugares (create_plan)
const rpc = await as(
  A,
  `select public.create_plan('  Día de museo  ', now() + interval '1 week', array['gp_museo', 'gp_cafe', 'gp_museo']) as id`
);
check('A crea un plan con lugares (create_plan)', !rpc.error && !!rpc.rows[0]?.id, rpc.error);
const rpcPlanId = rpc.rows[0]?.id;
const rpcPlan = await as(A, `select title, owner_id from public.plans where id = $1`, [rpcPlanId]);
check(
  'create_plan recorta el título y deja a A como dueño',
  rpcPlan.rows[0]?.title === 'Día de museo' && rpcPlan.rows[0]?.owner_id === A,
  JSON.stringify(rpcPlan)
);
const rpcPlaces = await as(
  A,
  `select place_id, sort_order from public.plan_places where plan_id = $1 order by sort_order`,
  [rpcPlanId]
);
check(
  'create_plan guarda los lugares en orden y sin duplicados',
  JSON.stringify(rpcPlaces.rows.map((row) => [row.place_id, row.sort_order])) ===
    JSON.stringify([
      ['gp_museo', 0],
      ['gp_cafe', 1],
    ]),
  JSON.stringify(rpcPlaces)
);
const blankTitle = await as(A, `select public.create_plan('   ', now(), array['gp_x'])`);
check('create_plan rechaza títulos vacíos', !!blankTitle.error, 'se permitió');
const blankLeftovers = await as(A, `select id from public.plans where title = ''`);
check('un create_plan fallido no deja planes a medias', blankLeftovers.rows.length === 0);
check(
  'anon no puede usar create_plan',
  !!(await asAnon(`select public.create_plan('x', now(), array['gp_x'])`)).error
);

// --- Planes favoritos
await as(A, `select public.add_plan_member_by_email($1, 'beto@test.com')`, [rpcPlanId]);
check(
  'B (miembro) guarda el plan en favoritos',
  !(await as(B, `insert into public.favorite_plans (plan_id) values ($1)`, [rpcPlanId])).error
);
check(
  'C (no miembro) no puede guardar el plan en favoritos',
  !!(await as(C, `insert into public.favorite_plans (plan_id) values ($1)`, [rpcPlanId])).error
);
check(
  'A no ve los planes favoritos de B',
  (await as(A, `select * from public.favorite_plans`)).rows.length === 0
);
check(
  'B ve su plan favorito',
  (await as(B, `select * from public.favorite_plans`)).rows.length === 1
);
await as(B, `delete from public.plan_members where plan_id = $1 and user_id = $2`, [rpcPlanId, B]);
check(
  'al salir del plan, B deja de ver el favorito',
  (await as(B, `select * from public.favorite_plans`)).rows.length === 0
);
check(
  'A guarda y quita su plan de favoritos',
  !(await as(A, `insert into public.favorite_plans (plan_id) values ($1)`, [rpcPlanId])).error &&
    (await as(A, `delete from public.favorite_plans where plan_id = $1`, [rpcPlanId])).affected ===
      1
);
await as(A, `delete from public.plans where id = $1`, [rpcPlanId]);

// --- Editar plan (update_plan) y administrar miembros desde el detalle
const editPlanId = (
  await as(
    A,
    `select public.create_plan('Plan a editar', now() + interval '2 days', array['gp_a', 'gp_b', 'gp_c']) as id`
  )
).rows[0]?.id;
await as(A, `select public.add_plan_member_by_email($1, 'beto@test.com')`, [editPlanId]);
const planPlaces = async () =>
  (
    await as(
      A,
      `select place_id, sort_order from public.plan_places where plan_id = $1 order by sort_order`,
      [editPlanId]
    )
  ).rows.map((row) => [row.place_id, row.sort_order]);

const edit = await as(
  A,
  `select public.update_plan($1, '  Plan editado  ', '2030-01-15 18:30:00+00', array['gp_c', 'gp_d', 'gp_a', 'gp_d'])`,
  [editPlanId]
);
check('A edita su plan con update_plan', !edit.error, edit.error);
const edited = await as(A, `select title, starts_at from public.plans where id = $1`, [editPlanId]);
check(
  'update_plan recorta el título y cambia la fecha',
  edited.rows[0]?.title === 'Plan editado' &&
    new Date(edited.rows[0]?.starts_at).toISOString() === '2030-01-15T18:30:00.000Z',
  JSON.stringify(edited)
);
check(
  'update_plan quita, agrega y reordena lugares sin duplicados',
  JSON.stringify(await planPlaces()) ===
    JSON.stringify([
      ['gp_c', 0],
      ['gp_d', 1],
      ['gp_a', 2],
    ]),
  JSON.stringify(await planPlaces())
);

const memberEdit = await as(B, `select public.update_plan($1, 'De B', now(), array['gp_x'])`, [
  editPlanId,
]);
check(
  'B (miembro) no puede editar el plan',
  /dueño/.test(memberEdit.error ?? ''),
  memberEdit.error
);
const strangerEdit = await as(C, `select public.update_plan($1, 'De C', now(), array['gp_x'])`, [
  editPlanId,
]);
check('C (no miembro) no puede editar el plan', !!strangerEdit.error, 'se permitió');
const blankEdit = await as(A, `select public.update_plan($1, '   ', now(), array['gp_x'])`, [
  editPlanId,
]);
check('update_plan rechaza títulos vacíos', !!blankEdit.error, 'se permitió');
check(
  'un update_plan fallido no cambia el plan',
  (await as(A, `select title from public.plans where id = $1`, [editPlanId])).rows[0]?.title ===
    'Plan editado' && (await planPlaces()).length === 3
);
check(
  'anon no puede usar update_plan',
  !!(await asAnon(`select public.update_plan($1, 'x', now(), array['gp_x'])`, [editPlanId])).error
);

const removed = await as(
  A,
  `delete from public.plan_members where plan_id = $1 and user_id = $2 returning user_id`,
  [editPlanId, B]
);
check('A quita a B del plan (delete ... returning)', removed.rows[0]?.user_id === B, removed.error);
await as(A, `select public.add_plan_member_by_email($1, 'beto@test.com')`, [editPlanId]);
const left = await as(
  B,
  `delete from public.plan_members where plan_id = $1 and user_id = $2 returning user_id`,
  [editPlanId, B]
);
check('B sale del plan (delete ... returning)', left.rows[0]?.user_id === B, left.error);
check(
  'B no puede eliminar un plan ajeno',
  (await as(B, `delete from public.plans where id = $1 returning id`, [editPlanId])).rows.length ===
    0
);
check(
  'A elimina el plan (delete ... returning)',
  (await as(A, `delete from public.plans where id = $1 returning id`, [editPlanId])).rows[0]?.id ===
    editPlanId
);

// --- Usuario sin sesión
check('anon no ve planes', (await asAnon(`select * from public.plans`)).rows.length === 0);
check('anon no ve perfiles', (await asAnon(`select * from public.profiles`)).rows.length === 0);
check(
  'anon no puede invitar',
  !!(await asAnon(`select public.add_plan_member_by_email($1, 'ana@test.com')`, [planId])).error
);

// --- Borrado en cascada
check(
  'A elimina su plan',
  (await as(A, `delete from public.plans where id = $1`, [planId])).affected === 1
);
const leftovers = await db.query(
  `select (select count(*) from public.plan_members) + (select count(*) from public.plan_places) as n`
);
check(
  'se borran miembros y lugares del plan',
  Number(leftovers.rows[0].n) === 0,
  JSON.stringify(leftovers.rows)
);

console.log(failures ? `\n${failures} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
process.exit(failures ? 1 : 0);
