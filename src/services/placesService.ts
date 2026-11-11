import { Linking } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '../utils/supabase';
import { messages } from '../utils/messages';
import {
  Coordinates,
  NearbySearchParams,
  Place,
  PlaceDetails,
  PriceLevel,
  SearchCategory,
  TextSearchParams,
} from '../types/places';

// Tipos de lugar de Google Places (tabla A) para cada actividad de Sorpréndeme
export const ACTIVITY_PLACE_TYPES: Record<string, string[]> = {
  'Aire libre': ['park', 'campground', 'zoo', 'tourist_attraction'],
  Cultural: ['museum', 'art_gallery', 'library', 'tourist_attraction'],
  Relajación: ['spa', 'cafe', 'park'],
  Gastronomía: ['restaurant', 'cafe', 'bakery', 'bar'],
  Entretenimiento: [
    'movie_theater',
    'amusement_park',
    'bowling_alley',
    'night_club',
    'shopping_mall',
  ],
};

export const BUDGET_PRICE_LEVELS: Record<string, PriceLevel[]> = {
  Bajo: ['PRICE_LEVEL_FREE', 'PRICE_LEVEL_INEXPENSIVE'],
  Medio: ['PRICE_LEVEL_MODERATE'],
  Alto: ['PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE'],
};

export const PRICE_LEVEL_LABELS: Record<PriceLevel, string> = {
  PRICE_LEVEL_FREE: 'Gratis',
  PRICE_LEVEL_INEXPENSIVE: 'Económico',
  PRICE_LEVEL_MODERATE: 'Moderado',
  PRICE_LEVEL_EXPENSIVE: 'Costoso',
  PRICE_LEVEL_VERY_EXPENSIVE: 'Muy costoso',
};

const NEARBY_PLACE_TYPES = [...new Set(Object.values(ACTIVITY_PLACE_TYPES).flat())];

// Filtros de la pantalla Buscar. Text Search solo acepta un tipo: se usa el primero.
export const SEARCH_CATEGORIES: SearchCategory[] = [
  { label: 'Todos', includedTypes: NEARBY_PLACE_TYPES },
  { label: 'Parques', includedTypes: ['park'] },
  { label: 'Cafeterías', includedTypes: ['cafe'] },
  { label: 'Museos', includedTypes: ['museum'] },
  { label: 'Restaurantes', includedTypes: ['restaurant'] },
  { label: 'Entretenimiento', includedTypes: ACTIVITY_PLACE_TYPES.Entretenimiento },
];

export const NEARBY_RADIUS_METERS = 5000;
const LOOKUP_BATCH_SIZE = 20;
const GENERIC_ERROR = messages.places.loadFailed;

// Caché en memoria mientras la app está abierta: favoritos y planes guardan solo el
// place_id y así no se vuelve a pedir a Google un lugar que ya se mostró. Las condiciones
// de Google Places no permiten guardar sus datos en el teléfono o en la base de datos.
const placeCache = new Map<string, Place>();
const detailsCache = new Map<string, PlaceDetails>();

function remember(places: Place[]) {
  places.forEach((place) => placeCache.set(place.id, place));
}

async function toPlacesError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (body?.error) return new Error(body.error);
  }
  return new Error(GENERIC_ERROR);
}

/** Llama a la Edge Function `places` (también la usa RoutesService para los traslados) */
export async function invokePlaces<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('places', { body });
  if (error) throw await toPlacesError(error);
  if (!data) throw new Error(GENERIC_ERROR);
  return data;
}

/**
 * Horario de hoy a partir de los de la semana de Google, que empiezan el lunes:
 * "lunes: 6:00 a.m.–6:00 p.m." → "6:00 a.m.–6:00 p.m."
 */
export function getTodayHours(weekdayHours: string[], today = new Date()): string | null {
  const description = weekdayHours[(today.getDay() + 6) % 7];
  if (!description) return null;
  const separator = description.indexOf(': ');
  return separator === -1 ? description : description.slice(separator + 2);
}

export class PlacesService {
  /**
   * Lugares cercanos a través de la Edge Function `places`
   */
  static async searchNearby(params: NearbySearchParams): Promise<Place[]> {
    const { places } = await invokePlaces<{ places: Place[] }>({ action: 'nearby', ...params });
    // Sin fotos no sirven para las listas de favoritos y planes
    if (params.includePhotos !== false) remember(places);
    return places;
  }

  /**
   * Búsqueda por texto ("café", "parque arví") priorizando los lugares cercanos
   */
  static async searchText(params: TextSearchParams): Promise<Place[]> {
    const { places } = await invokePlaces<{ places: Place[] }>({ action: 'text', ...params });
    remember(places);
    return places;
  }

  /**
   * Lugares de una categoría de Buscar: por texto si el usuario escribió algo,
   * si no, los más populares de la zona
   */
  static search(
    location: Coordinates,
    category: SearchCategory,
    query: string,
    radiusMeters = NEARBY_RADIUS_METERS
  ): Promise<Place[]> {
    const text = query.trim();
    if (text) {
      return PlacesService.searchText({
        query: text,
        location,
        radiusMeters,
        includedType: category.label === 'Todos' ? undefined : category.includedTypes[0],
        maxResults: 20,
      });
    }
    return PlacesService.searchNearby({
      location,
      radiusMeters,
      includedTypes: category.includedTypes,
      maxResults: 20,
    });
  }

  /**
   * Lugares populares de cualquier actividad para "Cerca de ti"
   */
  static getNearbyPlaces(location: Coordinates): Promise<Place[]> {
    return PlacesService.searchNearby({
      location,
      radiusMeters: NEARBY_RADIUS_METERS,
      includedTypes: NEARBY_PLACE_TYPES,
      maxResults: 10,
    });
  }

  /**
   * Ficha completa de un lugar: horario, descripción y servicios
   */
  static async getDetails(placeId: string): Promise<PlaceDetails> {
    const cached = detailsCache.get(placeId);
    if (cached) return cached;

    const { place } = await invokePlaces<{ place: PlaceDetails }>({ action: 'details', placeId });
    detailsCache.set(placeId, place);
    remember([place]);
    return place;
  }

  /**
   * Datos básicos de varios lugares guardados por ID, en el mismo orden.
   * Los que Google ya no tiene (cerrados o eliminados) no aparecen.
   */
  static async lookup(placeIds: string[]): Promise<Place[]> {
    const missing = [...new Set(placeIds)].filter((id) => !placeCache.has(id));

    for (let start = 0; start < missing.length; start += LOOKUP_BATCH_SIZE) {
      const { places } = await invokePlaces<{ places: Place[] }>({
        action: 'lookup',
        placeIds: missing.slice(start, start + LOOKUP_BATCH_SIZE),
      });
      remember(places);
    }

    return placeIds.flatMap((id) => {
      const place = placeCache.get(id);
      return place ? [place] : [];
    });
  }

  /**
   * Abre el lugar en la app de Google Maps (o en el navegador si no está instalada)
   */
  static openInMaps(place: Pick<Place, 'id' | 'name' | 'googleMapsUri'>): Promise<void> {
    return Linking.openURL(PlacesService.getMapsUrl(place));
  }

  static getMapsUrl({ id, name, googleMapsUri }: Pick<Place, 'id' | 'name' | 'googleMapsUri'>) {
    return (
      googleMapsUri ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${id}`
    );
  }
}
