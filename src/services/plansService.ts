import { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '../utils/supabase';
import { NewPlan, Plan } from '../types/plans';

type PlanRow = {
  id: string;
  title: string;
  starts_at: string;
  owner_id: string;
  plan_places: { place_id: string; sort_order: number }[];
  plan_members: {
    user_id: string;
    role: 'owner' | 'member';
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  }[];
};

const PLAN_COLUMNS = `
  id, title, starts_at, owner_id,
  plan_places (place_id, sort_order),
  plan_members (user_id, role, profiles (full_name, avatar_url))
`;

// Errores que lanzan a propósito las funciones de la base de datos (ver migraciones)
const NOT_OWNER = '42501';
const USER_NOT_FOUND = 'P0002';

function toPlansError(error: PostgrestError, action: string): Error {
  console.warn(`Planes: no se pudo ${action}`, error.message);
  return new Error(`No se pudo ${action}. Revisa tu conexión e intenta de nuevo.`);
}

// RLS no da error cuando el usuario no tiene permiso: simplemente no cambia ninguna fila
const NO_PERMISSION = 'No tienes permiso para hacer este cambio';

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    ownerId: row.owner_id,
    placeIds: [...row.plan_places]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((place) => place.place_id),
    // El dueño primero, como en las tarjetas del diseño
    members: [...row.plan_members]
      .sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner'))
      .map((member) => ({
        userId: member.user_id,
        role: member.role,
        fullName: member.profiles?.full_name ?? null,
        avatarUrl: member.profiles?.avatar_url ?? null,
      })),
  };
}

/**
 * Planes compartidos en Supabase. RLS devuelve solo los planes de los que el
 * usuario es dueño o miembro.
 */
export class PlansService {
  static async list(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select(PLAN_COLUMNS)
      .order('starts_at', { ascending: true });

    if (error) throw toPlansError(error, 'cargar tus planes');
    return (data as unknown as PlanRow[]).map(toPlan);
  }

  /**
   * Crea el plan y sus lugares en una sola transacción (función create_plan)
   */
  static async create({ title, startsAt, placeIds }: NewPlan): Promise<string> {
    const { data, error } = await supabase.rpc('create_plan', {
      p_title: title.trim(),
      p_starts_at: startsAt.toISOString(),
      p_place_ids: placeIds,
    });

    if (error) throw toPlansError(error, 'guardar el plan');
    return data as string;
  }

  /**
   * Un plan con sus lugares y miembros, o null si ya no existe o el usuario
   * dejó de ser miembro
   */
  static async get(planId: string): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('plans')
      .select(PLAN_COLUMNS)
      .eq('id', planId)
      .maybeSingle();

    if (error) throw toPlansError(error, 'cargar el plan');
    return data ? toPlan(data as unknown as PlanRow) : null;
  }

  /**
   * Cambia el título, la fecha y los lugares en una sola transacción (función update_plan).
   * Solo el dueño puede hacerlo.
   */
  static async update(planId: string, { title, startsAt, placeIds }: NewPlan): Promise<void> {
    const { error } = await supabase.rpc('update_plan', {
      p_plan_id: planId,
      p_title: title.trim(),
      p_starts_at: startsAt.toISOString(),
      p_place_ids: placeIds,
    });

    if (error?.code === NOT_OWNER) throw new Error('Solo quien creó el plan puede editarlo');
    if (error) throw toPlansError(error, 'guardar los cambios');
  }

  /**
   * Agrega al plan a la persona que tiene una cuenta con ese correo (solo el dueño)
   */
  static async invite(planId: string, email: string): Promise<void> {
    const { error } = await supabase.rpc('add_plan_member_by_email', {
      p_plan_id: planId,
      p_email: email.trim(),
    });

    if (error?.code === USER_NOT_FOUND) {
      throw new Error('No hay ninguna cuenta de PlanIt con ese correo');
    }
    if (error?.code === NOT_OWNER) {
      throw new Error('Solo quien creó el plan puede invitar personas');
    }
    if (error) throw toPlansError(error, 'invitar a esa persona');
  }

  /**
   * Saca a alguien del plan: el dueño puede quitar a cualquier invitado y cada
   * invitado puede salirse. El dueño no puede salirse; debe eliminar el plan.
   */
  static async removeMember(planId: string, userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('plan_members')
      .delete()
      .eq('plan_id', planId)
      .eq('user_id', userId)
      .select('user_id');

    if (error) throw toPlansError(error, 'actualizar las personas del plan');
    if (!data?.length) throw new Error(NO_PERMISSION);
  }

  /**
   * Elimina el plan para todos sus miembros (solo el dueño)
   */
  static async remove(planId: string): Promise<void> {
    const { data, error } = await supabase.from('plans').delete().eq('id', planId).select('id');

    if (error) throw toPlansError(error, 'eliminar el plan');
    if (!data?.length) throw new Error(NO_PERMISSION);
  }
}
