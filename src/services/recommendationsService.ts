import { Coordinates, Place, RecommendationNote, RecommendationPreferences } from '../types/places';
import { getRecommendationNotes, rankRecommendations } from '../utils/recommendations';
import { ACTIVITY_PLACE_TYPES, BUDGET_PRICE_LEVELS, PlacesService } from './placesService';
import { WeatherService } from './weatherService';

const RECOMMENDATIONS_LIMIT = 10;

export type Recommendations = {
  places: Place[];
  notes: RecommendationNote[];
};

/**
 * Sorpréndeme: junta los lugares de Google, el clima de Open-Meteo y las reglas de
 * utils/recommendations
 */
export class RecommendationsService {
  /**
   * Lugares de las actividades elegidas dentro del presupuesto, ordenados por calificación,
   * clima y compañía. Nearby Search no filtra por precio, así que el presupuesto se aplica
   * sobre los resultados; los lugares sin nivel de precio (parques, museos) se aceptan con
   * cualquier presupuesto.
   */
  static async get(
    location: Coordinates,
    { activities, budget, maxDistanceKm, company }: RecommendationPreferences
  ): Promise<Recommendations> {
    const includedTypes = [
      ...new Set(activities.flatMap((activity) => ACTIVITY_PLACE_TYPES[activity] ?? [])),
    ];

    const [places, weather] = await Promise.all([
      PlacesService.searchNearby({
        location,
        radiusMeters: maxDistanceKm * 1000,
        includedTypes,
        maxResults: 20,
      }),
      // El clima mejora el orden, pero sin él las recomendaciones siguen sirviendo
      WeatherService.getCurrent(location).catch(() => null),
    ]);

    const allowedPriceLevels = BUDGET_PRICE_LEVELS[budget] ?? [];
    const affordable = places.filter(
      (place) => !place.priceLevel || allowedPriceLevels.includes(place.priceLevel)
    );

    const context = { weather, company };
    const ranked = rankRecommendations(affordable, context).slice(0, RECOMMENDATIONS_LIMIT);
    return { places: ranked, notes: getRecommendationNotes(context, ranked) };
  }
}
