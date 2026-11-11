import { Itinerary, ItineraryStop, RouteLeg, TransportMode } from '../types/plans';
import { addMinutes } from './date';
import { matchesAnyType } from './recommendations';

/**
 * Reglas del organizador de planes: cuánto se quedan en cada lugar y a qué hora llegan a
 * cada uno, sumando las estadías y los traslados de Google Routes.
 */

export const TRANSPORT_MODES: { value: TransportMode; label: string; longLabel: string }[] = [
  { value: 'walk', label: 'A pie', longLabel: 'A pie' },
  { value: 'drive', label: 'Carro', longLabel: 'En carro' },
  { value: 'transit', label: 'Transporte', longLabel: 'En transporte público' },
];

export const DEFAULT_TRANSPORT_MODE: TransportMode = 'walk';

/** Opciones de tiempo en un lugar, en minutos (la base de datos acepta de 5 a 720) */
export const STAY_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];
export const DEFAULT_STAY_MINUTES = 60;

// Tiempo típico según el tipo de lugar de Google: la primera regla que coincide gana, por eso
// las más específicas van primero ("fast_food_restaurant" antes que "restaurant")
const STAY_RULES: { types: string[]; minutes: number }[] = [
  { types: ['fast_food_restaurant', 'ice_cream_shop', 'juice_shop'], minutes: 30 },
  { types: ['cafe', 'coffee_shop', 'bakery', 'tea_house', 'dessert_shop'], minutes: 45 },
  { types: ['restaurant', 'bar', 'pub', 'spa', 'bowling_alley', 'video_arcade'], minutes: 90 },
  {
    types: ['museum', 'art_gallery', 'aquarium', 'botanical_garden', 'shopping_mall'],
    minutes: 120,
  },
  {
    types: ['movie_theater', 'performing_arts_theater', 'concert_hall', 'stadium', 'karaoke'],
    minutes: 150,
  },
  {
    types: ['zoo', 'amusement_park', 'water_park', 'national_park', 'hiking_area', 'night_club'],
    minutes: 180,
  },
];

export function getDefaultStayMinutes(type: string | null): number {
  return (
    STAY_RULES.find((rule) => matchesAnyType(type, rule.types))?.minutes ?? DEFAULT_STAY_MINUTES
  );
}

export function getTransportLabel(mode: TransportMode, long = false): string {
  const option = TRANSPORT_MODES.find((item) => item.value === mode) ?? TRANSPORT_MODES[0];
  return long ? option.longLabel : option.label;
}

/**
 * Horario del plan: llega al primer lugar a la hora de inicio, se queda su tiempo, se
 * traslada al siguiente y así. `legs[i]` es el traslado del lugar i al i + 1.
 */
export function buildItinerary(
  startsAt: Date,
  placeIds: string[],
  stayMinutes: Record<string, number>,
  legs: (RouteLeg | null | undefined)[]
): Itinerary {
  const stops: ItineraryStop[] = [];
  let clock = startsAt;
  let travelMinutes = 0;
  let distanceMeters = 0;
  let unknownLegs = 0;

  placeIds.forEach((placeId, index) => {
    const stay = stayMinutes[placeId] ?? DEFAULT_STAY_MINUTES;
    const arrivesAt = clock;
    const leavesAt = addMinutes(arrivesAt, stay);
    stops.push({ placeId, stayMinutes: stay, arrivesAt, leavesAt });
    clock = leavesAt;

    if (index === placeIds.length - 1) return;
    const leg = legs[index];
    if (leg?.durationSeconds == null) {
      unknownLegs++;
      return;
    }
    const minutes = leg.durationSeconds / 60;
    travelMinutes += minutes;
    distanceMeters += leg.distanceMeters ?? 0;
    clock = addMinutes(clock, minutes);
  });

  return {
    stops,
    endsAt: stops.length > 0 ? clock : null,
    travelMinutes,
    distanceMeters,
    unknownLegs,
  };
}
