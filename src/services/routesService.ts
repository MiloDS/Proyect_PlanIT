import { RouteLeg, TransportMode } from '../types/plans';
import { messages } from '../utils/messages';
import { invokePlaces } from './placesService';

// Igual que el límite de la acción "routes" de la Edge Function
const MAX_LEGS_PER_REQUEST = 10;

// Caché en memoria mientras la app está abierta: al reordenar, editar o volver a abrir un
// plan no se le pide de nuevo a Google un traslado que ya se calculó
const legCache = new Map<string, RouteLeg>();

const cacheKey = (mode: TransportMode, from: string, to: string) => `${mode}:${from}>${to}`;

function toPairs(placeIds: string[]) {
  return placeIds.slice(1).map((to, index) => ({ from: placeIds[index], to }));
}

/**
 * Distancia y tiempo de traslado entre los lugares de un plan (Google Routes, a través de
 * la Edge Function `places`)
 */
export class RoutesService {
  /**
   * Traslado de cada lugar al siguiente, en orden. Un traslado sin ruta trae distancia y
   * tiempo en null; uno que falló queda en null para volver a pedirlo después.
   */
  static async getLegs(placeIds: string[], mode: TransportMode): Promise<(RouteLeg | null)[]> {
    const pairs = toPairs(placeIds);
    const missing = pairs.filter(({ from, to }) => !legCache.has(cacheKey(mode, from, to)));

    try {
      for (let start = 0; start < missing.length; start += MAX_LEGS_PER_REQUEST) {
        const { legs } = await invokePlaces<{ legs: (RouteLeg & { failed?: boolean })[] }>({
          action: 'routes',
          mode,
          legs: missing.slice(start, start + MAX_LEGS_PER_REQUEST),
        });
        legs.forEach(({ failed, ...leg }) => {
          if (!failed) legCache.set(cacheKey(mode, leg.from, leg.to), leg);
        });
      }
    } catch (err: any) {
      console.warn('Traslados: no se pudieron calcular', err?.message);
      throw new Error(messages.plans.routesFailed);
    }

    return RoutesService.getCachedLegs(placeIds, mode);
  }

  /** Los traslados que ya se conocen, sin pedir nada (null en los demás) */
  static getCachedLegs(placeIds: string[], mode: TransportMode): (RouteLeg | null)[] {
    return toPairs(placeIds).map(({ from, to }) => legCache.get(cacheKey(mode, from, to)) ?? null);
  }
}
