import { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '../utils/supabase';
import { messages } from '../utils/messages';
import { DEFAULT_STAY_MINUTES } from '../utils/itinerary';
import { PlanChanges, PlanSuggestion, PlanSuggestionStatus, TransportMode } from '../types/plans';

// Fila de plan_suggestions: changed_fields dice cuáles de las columnas aplicar
type SuggestionRow = {
  id: string;
  plan_id: string;
  author_id: string;
  message: string | null;
  changed_fields: string[];
  title: string | null;
  starts_at: string | null;
  transport_mode: TransportMode | null;
  budget_per_person: number | null;
  notes: string | null;
  place_ids: string[] | null;
  stay_minutes: number[] | null;
  status: PlanSuggestionStatus;
  created_at: string;
  resolved_at: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

const SUGGESTION_COLUMNS = `
  id, plan_id, author_id, message, changed_fields, title, starts_at, transport_mode,
  budget_per_person, notes, place_ids, stay_minutes, status, created_at, resolved_at,
  profiles (full_name, avatar_url)
`;

// Errores que lanzan la base de datos o sus funciones (ver la migración de sugerencias)
const NO_PERMISSION = '42501';
const ALREADY_PENDING = '23505';
const ALREADY_ANSWERED = '22023';
const NOT_FOUND = 'P0002';

function toSuggestionsError(error: PostgrestError, message: string): Error {
  console.warn(`Sugerencias: ${message}`, error.message);
  return new Error(message);
}

function toChanges(row: SuggestionRow): PlanChanges {
  const changed = new Set(row.changed_fields);
  const changes: PlanChanges = {};

  if (changed.has('title') && row.title !== null) changes.title = row.title.trim();
  if (changed.has('starts_at') && row.starts_at) changes.startsAt = row.starts_at;
  if (changed.has('transport_mode') && row.transport_mode) {
    changes.transportMode = row.transport_mode;
  }
  if (changed.has('budget_per_person')) changes.budgetPerPerson = row.budget_per_person;
  if (changed.has('notes')) changes.notes = row.notes?.trim() || null;
  if (changed.has('places') && row.place_ids && row.stay_minutes) {
    const stays = row.stay_minutes;
    changes.places = {
      placeIds: row.place_ids,
      stayMinutes: Object.fromEntries(row.place_ids.map((id, index) => [id, stays[index]])),
    };
  }

  return changes;
}

function toSuggestion(row: SuggestionRow): PlanSuggestion {
  return {
    id: row.id,
    planId: row.plan_id,
    authorId: row.author_id,
    authorName: row.profiles?.full_name ?? null,
    authorAvatarUrl: row.profiles?.avatar_url ?? null,
    message: row.message,
    changes: toChanges(row),
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

// Columnas que se guardan para cada cambio; las que no cambian quedan en null
function toInsertRow(planId: string, changes: PlanChanges, message: string) {
  const changedFields: string[] = [];
  const row: Record<string, unknown> = { plan_id: planId, message: message.trim() || null };

  if (changes.title !== undefined) {
    changedFields.push('title');
    row.title = changes.title.trim();
  }
  if (changes.startsAt !== undefined) {
    changedFields.push('starts_at');
    row.starts_at = changes.startsAt;
  }
  if (changes.transportMode !== undefined) {
    changedFields.push('transport_mode');
    row.transport_mode = changes.transportMode;
  }
  if (changes.budgetPerPerson !== undefined) {
    changedFields.push('budget_per_person');
    row.budget_per_person = changes.budgetPerPerson;
  }
  if (changes.notes !== undefined) {
    changedFields.push('notes');
    row.notes = changes.notes?.trim() || null;
  }
  if (changes.places) {
    const { placeIds, stayMinutes } = changes.places;
    changedFields.push('places');
    row.place_ids = placeIds;
    row.stay_minutes = placeIds.map((id) => stayMinutes[id] ?? DEFAULT_STAY_MINUTES);
  }

  return { ...row, changed_fields: changedFields };
}

/**
 * Sugerencias de cambios a un plan. Los invitados las envían y quien creó el plan las acepta
 * (los cambios se aplican solos) o las rechaza. RLS solo muestra las de los planes donde el
 * usuario es miembro.
 */
export class PlanSuggestionsService {
  /** Las sugerencias del plan, de la más reciente a la más antigua */
  static async list(planId: string): Promise<PlanSuggestion[]> {
    const { data, error } = await supabase
      .from('plan_suggestions')
      .select(SUGGESTION_COLUMNS)
      .eq('plan_id', planId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw toSuggestionsError(error, messages.suggestions.loadFailed);
    return (data as unknown as SuggestionRow[]).map(toSuggestion);
  }

  /** Envía los cambios que propone un invitado, con un mensaje opcional */
  static async create(planId: string, changes: PlanChanges, message = ''): Promise<void> {
    const { error } = await supabase
      .from('plan_suggestions')
      .insert(toInsertRow(planId, changes, message));

    if (error?.code === ALREADY_PENDING) throw new Error(messages.suggestions.alreadyPending);
    if (error?.code === NO_PERMISSION) throw new Error(messages.suggestions.cannotSuggest);
    if (error) throw toSuggestionsError(error, messages.suggestions.sendFailed);
  }

  /** Aplica la sugerencia al plan (solo quien lo creó) */
  static async accept(suggestionId: string): Promise<void> {
    const { error } = await supabase.rpc('accept_plan_suggestion', {
      p_suggestion_id: suggestionId,
    });
    if (error) throw PlanSuggestionsService.toAnswerError(error);
  }

  /** La marca como rechazada; el plan no cambia (solo quien lo creó) */
  static async reject(suggestionId: string): Promise<void> {
    const { error } = await supabase.rpc('reject_plan_suggestion', {
      p_suggestion_id: suggestionId,
    });
    if (error) throw PlanSuggestionsService.toAnswerError(error);
  }

  /** Quien la envió la retira mientras siga pendiente */
  static async withdraw(suggestionId: string): Promise<void> {
    const { data, error } = await supabase
      .from('plan_suggestions')
      .delete()
      .eq('id', suggestionId)
      .select('id');

    if (error) throw toSuggestionsError(error, messages.suggestions.withdrawFailed);
    // RLS no da error si ya fue respondida: simplemente no borra ninguna fila
    if (!data?.length) throw new Error(messages.suggestions.alreadyAnswered);
  }

  private static toAnswerError(error: PostgrestError): Error {
    if (error.code === NO_PERMISSION) return new Error(messages.suggestions.onlyOwnerCanAnswer);
    if (error.code === ALREADY_ANSWERED) return new Error(messages.suggestions.alreadyAnswered);
    if (error.code === NOT_FOUND) return new Error(messages.suggestions.gone);
    return toSuggestionsError(error, messages.suggestions.answerFailed);
  }
}
