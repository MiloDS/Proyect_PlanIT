import { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '../utils/supabase';
import { messages } from '../utils/messages';
import { JoinPlanResult, NewPlan, Plan, TransportMode } from '../types/plans';
import { normalizeInviteCode } from '../utils/inviteCode';
import { DEFAULT_STAY_MINUTES } from '../utils/itinerary';

type PlanRow = {
  id: string;
  title: string;
  starts_at: string;
  owner_id: string;
  invite_code: string;
  transport_mode: TransportMode;
  budget_per_person: number | null;
  notes: string | null;
  plan_places: { place_id: string; sort_order: number; stay_minutes: number }[];
  plan_members: {
    user_id: string;
    role: 'owner' | 'member';
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  }[];
  plan_suggestions: { status: string }[];
};

const PLAN_COLUMNS = `
  id, title, starts_at, owner_id, invite_code, transport_mode, budget_per_person, notes,
  plan_places (place_id, sort_order, stay_minutes),
  plan_members (user_id, role, profiles (full_name, avatar_url)),
  plan_suggestions (status)
`;

// Errores que lanzan a propósito las funciones de la base de datos (ver migraciones)
const NOT_OWNER = '42501';
const USER_NOT_FOUND = 'P0002';

// Parámetros comunes de create_plan y update_plan
function toPlanParams(plan: NewPlan) {
  return {
    p_title: plan.title.trim(),
    p_starts_at: plan.startsAt.toISOString(),
    p_place_ids: plan.placeIds,
    p_stay_minutes: plan.placeIds.map((id) => plan.stayMinutes[id] ?? DEFAULT_STAY_MINUTES),
    p_transport_mode: plan.transportMode,
    p_budget_per_person: plan.budgetPerPerson,
    p_notes: plan.notes.trim() || null,
  };
}

function toPlansError(error: PostgrestError, message: string): Error {
  console.warn(`Planes: ${message}`, error.message);
  return new Error(message);
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
    stayMinutes: Object.fromEntries(
      row.plan_places.map((place) => [place.place_id, place.stay_minutes])
    ),
    transportMode: row.transport_mode,
    budgetPerPerson: row.budget_per_person,
    notes: row.notes,
    inviteCode: row.invite_code,
    // El dueño primero, como en las tarjetas del diseño
    members: [...row.plan_members]
      .sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner'))
      .map((member) => ({
        userId: member.user_id,
        role: member.role,
        fullName: member.profiles?.full_name ?? null,
        avatarUrl: member.profiles?.avatar_url ?? null,
      })),
    pendingSuggestions: (row.plan_suggestions ?? []).filter(
      (suggestion) => suggestion.status === 'pending'
    ).length,
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

    if (error) throw toPlansError(error, messages.plans.loadListFailed);
    return (data as unknown as PlanRow[]).map(toPlan);
  }

  /**
   * Crea el plan y sus lugares en una sola transacción (función create_plan). Devuelve su id.
   */
  static async create(plan: NewPlan): Promise<string> {
    const { data, error } = await supabase.rpc('create_plan', toPlanParams(plan));

    if (error) throw toPlansError(error, messages.plans.createFailed);
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

    if (error) throw toPlansError(error, messages.plans.loadFailed);
    return data ? toPlan(data as unknown as PlanRow) : null;
  }

  /**
   * Cambia los datos y los lugares en una sola transacción (función update_plan).
   * Solo el dueño puede hacerlo.
   */
  static async update(planId: string, plan: NewPlan): Promise<void> {
    const { error } = await supabase.rpc('update_plan', {
      p_plan_id: planId,
      ...toPlanParams(plan),
    });

    if (error?.code === NOT_OWNER) throw new Error(messages.plans.onlyOwnerCanEdit);
    if (error) throw toPlansError(error, messages.plans.updateFailed);
  }

  /**
   * Agrega un lugar al final del plan (función add_plan_place). Devuelve false si el lugar
   * ya estaba en el plan.
   */
  static async addPlace(planId: string, placeId: string, stayMinutes: number): Promise<boolean> {
    const { data, error } = await supabase.rpc('add_plan_place', {
      p_plan_id: planId,
      p_place_id: placeId,
      p_stay_minutes: stayMinutes,
    });

    if (error) throw toPlansError(error, messages.plans.addPlaceFailed);
    return data === true;
  }

  /**
   * Agrega al plan a la persona que tiene una cuenta con ese correo (solo el dueño)
   */
  static async invite(planId: string, email: string): Promise<void> {
    const { error } = await supabase.rpc('add_plan_member_by_email', {
      p_plan_id: planId,
      p_email: email.trim(),
    });

    if (error?.code === USER_NOT_FOUND) throw new Error(messages.plans.accountNotFound);
    if (error?.code === NOT_OWNER) throw new Error(messages.plans.onlyOwnerCanInvite);
    if (error) throw toPlansError(error, messages.plans.inviteFailed);
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

    if (error) throw toPlansError(error, messages.plans.membersUpdateFailed);
    // RLS no da error cuando el usuario no tiene permiso: simplemente no borra ninguna fila
    if (!data?.length) throw new Error(messages.plans.noPermission);
  }

  /**
   * Elimina el plan para todos sus miembros (solo el dueño)
   */
  static async remove(planId: string): Promise<void> {
    const { data, error } = await supabase.from('plans').delete().eq('id', planId).select('id');

    if (error) throw toPlansError(error, messages.plans.deleteFailed);
    if (!data?.length) throw new Error(messages.plans.noPermission);
  }

  /**
   * Se une al plan que tiene ese código (función join_plan_by_code). Cualquier persona con
   * sesión y el código entra como invitada.
   */
  static async joinByCode(code: string): Promise<JoinPlanResult> {
    const { data, error } = await supabase.rpc('join_plan_by_code', {
      p_code: normalizeInviteCode(code),
    });

    if (error?.code === USER_NOT_FOUND) throw new Error(messages.plans.inviteCodeNotFound);
    if (error) throw toPlansError(error, messages.plans.joinFailed);
    const row = (data as { plan_id: string; already_member: boolean }[] | null)?.[0];
    if (!row) throw new Error(messages.plans.joinFailed);
    return { planId: row.plan_id, alreadyMember: row.already_member };
  }

  /**
   * Le da al plan un código nuevo; el anterior deja de servir (solo el dueño)
   */
  static async regenerateInviteCode(planId: string): Promise<string> {
    const { data, error } = await supabase.rpc('regenerate_plan_invite_code', {
      p_plan_id: planId,
    });

    if (error?.code === NOT_OWNER) throw new Error(messages.plans.onlyOwnerCanChangeCode);
    if (error) throw toPlansError(error, messages.plans.regenerateCodeFailed);
    return data as string;
  }
}
