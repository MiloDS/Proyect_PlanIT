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

function toPlansError(error: PostgrestError, action: string): Error {
  console.warn(`Planes: no se pudo ${action}`, error.message);
  return new Error(`No se pudo ${action}. Revisa tu conexión e intenta de nuevo.`);
}

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
}
