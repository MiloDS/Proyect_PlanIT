import { Linking } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '../utils/supabase';
import {
  Coordinates,
  NearbySearchParams,
  Place,
  PriceLevel,
  RecommendationPreferences,
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

const NEARBY_RADIUS_METERS = 5000;
const NEARBY_PLACE_TYPES = [...new Set(Object.values(ACTIVITY_PLACE_TYPES).flat())];
// La recomendación se elige al azar entre los mejor calificados para que varíe
const RECOMMENDATION_POOL_SIZE = 5;

async function toPlacesError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (body?.error) return new Error(body.error);
  }
  return new Error('No se pudieron cargar los lugares. Revisa tu conexión e intenta de nuevo.');
}

export class PlacesService {
  /**
   * Lugares cercanos a través de la Edge Function `places`
   */
  static async searchNearby(params: NearbySearchParams): Promise<Place[]> {
    const { data, error } = await supabase.functions.invoke<{ places: Place[] }>('places', {
      body: params,
    });

    if (error) throw await toPlacesError(error);
    return data?.places ?? [];
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
   * Recomendación de Sorpréndeme. Nearby Search no filtra por precio, así que el
   * presupuesto se aplica sobre los resultados; los lugares sin nivel de precio
   * (parques, museos) se aceptan con cualquier presupuesto.
   */
  static async recommend(
    location: Coordinates,
    { activities, budget, maxDistanceKm }: RecommendationPreferences
  ): Promise<Place | null> {
    const includedTypes = [
      ...new Set(activities.flatMap((activity) => ACTIVITY_PLACE_TYPES[activity] ?? [])),
    ];
    const places = await PlacesService.searchNearby({
      location,
      radiusMeters: maxDistanceKm * 1000,
      includedTypes,
      maxResults: 20,
      includePhotos: false,
    });

    const allowedPriceLevels = BUDGET_PRICE_LEVELS[budget] ?? [];
    const candidates = places
      .filter((place) => !place.priceLevel || allowedPriceLevels.includes(place.priceLevel))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, RECOMMENDATION_POOL_SIZE);

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * Abre el lugar en la app de Google Maps (o en el navegador si no está instalada)
   */
  static openInMaps(place: Place): Promise<void> {
    const url =
      place.googleMapsUri ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`;
    return Linking.openURL(url);
  }
}
