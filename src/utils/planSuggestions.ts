import { NewPlan, Plan, PlanChangeRow, PlanChanges } from '../types/plans';
import { formatPesos } from './currency';
import { formatDuration, formatLongDate, formatTime } from './date';
import { DEFAULT_STAY_MINUTES, getTransportLabel } from './itinerary';

/**
 * Reglas de las sugerencias de cambios: qué cambió un invitado en el formulario del plan y
 * cómo se ve cada cambio frente al plan actual ("antes → después").
 */

function getStay(stayMinutes: Record<string, number>, placeId: string): number {
  return stayMinutes[placeId] ?? DEFAULT_STAY_MINUTES;
}

function normalizeNotes(notes: string | null): string | null {
  return notes?.trim() || null;
}

function formatBudget(amount: number | null): string {
  return amount === null ? 'Sin presupuesto' : formatPesos(amount);
}

/**
 * Lo que cambió el formulario frente al plan. `originalPlaceIds` son los lugares del plan que
 * cargó el formulario: si Google ya no tiene alguno, que no aparezca no es un cambio del
 * invitado.
 */
export function getPlanChanges(
  plan: Plan,
  edited: NewPlan,
  originalPlaceIds: string[]
): PlanChanges {
  const changes: PlanChanges = {};

  const title = edited.title.trim();
  if (title !== plan.title) changes.title = title;
  if (edited.startsAt.getTime() !== new Date(plan.startsAt).getTime()) {
    changes.startsAt = edited.startsAt.toISOString();
  }
  if (edited.transportMode !== plan.transportMode) changes.transportMode = edited.transportMode;
  if (edited.budgetPerPerson !== plan.budgetPerPerson) {
    changes.budgetPerPerson = edited.budgetPerPerson;
  }
  const notes = normalizeNotes(edited.notes);
  if (notes !== normalizeNotes(plan.notes)) changes.notes = notes;

  const placesChanged =
    edited.placeIds.length !== originalPlaceIds.length ||
    edited.placeIds.some(
      (id, index) =>
        id !== originalPlaceIds[index] ||
        getStay(edited.stayMinutes, id) !== getStay(plan.stayMinutes, id)
    );
  if (placesChanged) {
    changes.places = {
      placeIds: edited.placeIds,
      stayMinutes: Object.fromEntries(
        edited.placeIds.map((id) => [id, getStay(edited.stayMinutes, id)])
      ),
    };
  }

  return changes;
}

/** Sugerencia de agregar un lugar al final del recorrido (desde la ficha del lugar) */
export function getAddPlaceChanges(plan: Plan, placeId: string, stayMinutes: number): PlanChanges {
  return {
    places: {
      placeIds: [...plan.placeIds, placeId],
      stayMinutes: { ...plan.stayMinutes, [placeId]: stayMinutes },
    },
  };
}

export function hasChanges(changes: PlanChanges): boolean {
  return Object.values(changes).some((value) => value !== undefined);
}

function describePlaceChanges(
  plan: Plan,
  proposed: NonNullable<PlanChanges['places']>,
  getPlaceName: (placeId: string) => string
): PlanChangeRow[] {
  const rows: PlanChangeRow[] = [];
  const current = plan.placeIds;

  proposed.placeIds
    .filter((id) => !current.includes(id))
    .forEach((id) =>
      rows.push({
        label: 'Agrega un lugar',
        before: '',
        after: `${getPlaceName(id)} (${formatDuration(getStay(proposed.stayMinutes, id))})`,
      })
    );
  current
    .filter((id) => !proposed.placeIds.includes(id))
    .forEach((id) => rows.push({ label: 'Quita un lugar', before: getPlaceName(id), after: '' }));

  proposed.placeIds
    .filter(
      (id) =>
        current.includes(id) && getStay(plan.stayMinutes, id) !== getStay(proposed.stayMinutes, id)
    )
    .forEach((id) =>
      rows.push({
        label: `Tiempo en ${getPlaceName(id)}`,
        before: formatDuration(getStay(plan.stayMinutes, id)),
        after: formatDuration(getStay(proposed.stayMinutes, id)),
      })
    );

  // El orden solo se compara entre los lugares que siguen en el plan
  const keptBefore = current.filter((id) => proposed.placeIds.includes(id));
  const keptAfter = proposed.placeIds.filter((id) => current.includes(id));
  if (keptAfter.some((id, index) => id !== keptBefore[index])) {
    rows.push({
      label: 'Orden del recorrido',
      before: keptBefore.map(getPlaceName).join(', '),
      after: keptAfter.map(getPlaceName).join(', '),
    });
  }

  return rows;
}

/**
 * El "antes → después" de una sugerencia frente al plan como está ahora. Lo que ya está igual
 * en el plan no aparece: una lista vacía significa que el plan ya tiene esos cambios.
 */
export function describePlanChanges(
  plan: Plan,
  changes: PlanChanges,
  getPlaceName: (placeId: string) => string
): PlanChangeRow[] {
  const rows: PlanChangeRow[] = [];
  const add = (label: string, before: string, after: string) => {
    if (before !== after) rows.push({ label, before, after });
  };

  if (changes.title !== undefined) add('Nombre', plan.title, changes.title);
  if (changes.startsAt !== undefined) {
    const before = new Date(plan.startsAt);
    const after = new Date(changes.startsAt);
    add('Fecha', formatLongDate(before), formatLongDate(after));
    add('Hora de inicio', formatTime(before), formatTime(after));
  }
  if (changes.transportMode !== undefined) {
    add(
      'Cómo se mueven',
      getTransportLabel(plan.transportMode, true),
      getTransportLabel(changes.transportMode, true)
    );
  }
  if (changes.budgetPerPerson !== undefined) {
    add(
      'Presupuesto por persona',
      formatBudget(plan.budgetPerPerson),
      formatBudget(changes.budgetPerPerson)
    );
  }
  if (changes.notes !== undefined) {
    add('Notas', normalizeNotes(plan.notes) ?? 'Sin notas', changes.notes ?? 'Sin notas');
  }
  if (changes.places) rows.push(...describePlaceChanges(plan, changes.places, getPlaceName));

  return rows;
}

/** Todos los lugares que mencionan las sugerencias, para buscar sus nombres de una vez */
export function getSuggestedPlaceIds(changesList: PlanChanges[]): string[] {
  return [...new Set(changesList.flatMap((changes) => changes.places?.placeIds ?? []))];
}
