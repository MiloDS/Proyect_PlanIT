import { Place, RecommendationNote } from '../types/places';
import { Weather, WeatherCondition } from '../types/weather';
import { messages } from './messages';

/**
 * Reglas de Sorpréndeme para ordenar los lugares según el clima y la compañía. Son
 * reglas simples y explicables: la pantalla muestra en una nota por qué cambió el orden.
 */

export type PlaceSetting = 'indoor' | 'outdoor' | 'unknown';

/** Hacia dónde empuja el clima: lugares bajo techo, al aire libre o ninguno */
export type WeatherAdvice = 'indoor' | 'outdoor' | null;

type CompanyRule = {
  /** Tipos de Google que encajan mejor con esa compañía: suben en la lista */
  preferredTypes: string[];
  /** Tipos que no se recomiendan con esa compañía */
  excludedTypes: string[];
};

// Tipos principales de Google Places (tabla A). Los que no están aquí, como
// "tourist_attraction", pueden ser de los dos y no cambian el orden.
const OUTDOOR_TYPES = [
  'park',
  'campground',
  'zoo',
  'amusement_park',
  'water_park',
  'hiking_area',
  'national_park',
  'state_park',
  'botanical_garden',
  'garden',
  'dog_park',
  'plaza',
  'beach',
  'picnic_ground',
  'playground',
  'marina',
  'observation_deck',
  'golf_course',
  'stadium',
  'monument',
  'sculpture',
];

const INDOOR_TYPES = [
  'museum',
  'art_gallery',
  'library',
  'spa',
  'cafe',
  'bakery',
  'restaurant',
  'bar',
  'night_club',
  'movie_theater',
  'bowling_alley',
  'shopping_mall',
  'aquarium',
  'performing_arts_theater',
  'concert_hall',
  'casino',
  'tea_house',
  'karaoke',
  'video_arcade',
  'planetarium',
  'cultural_center',
  'church',
  'gym',
  'shop',
  'store',
];

const RAINY_CONDITIONS: WeatherCondition[] = ['drizzle', 'rain', 'storm', 'snow'];
const SUNNY_CONDITIONS: WeatherCondition[] = ['clear', 'partlyCloudy'];

// Con un rango de calificaciones de 0 a 5, el clima pesa más que la compañía
const WEATHER_WEIGHT = 2;
const COMPANY_WEIGHT = 1;

export const COMPANY_RULES: Record<string, CompanyRule> = {
  Solo: {
    preferredTypes: [
      'cafe',
      'coffee_shop',
      'library',
      'museum',
      'art_gallery',
      'book_store',
      'park',
    ],
    excludedTypes: [],
  },
  Pareja: {
    preferredTypes: ['restaurant', 'cafe', 'coffee_shop', 'spa', 'movie_theater', 'wine_bar'],
    excludedTypes: [],
  },
  Amigos: {
    preferredTypes: [
      'bar',
      'pub',
      'night_club',
      'bowling_alley',
      'amusement_park',
      'movie_theater',
      'video_arcade',
      'karaoke',
    ],
    excludedTypes: [],
  },
  Familia: {
    preferredTypes: [
      'park',
      'zoo',
      'amusement_park',
      'aquarium',
      'museum',
      'shopping_mall',
      'playground',
      'ice_cream_shop',
    ],
    excludedTypes: ['bar', 'pub', 'night_club', 'casino'],
  },
};

export const COMPANY_OPTIONS = Object.keys(COMPANY_RULES);

/**
 * "italian_restaurant" cuenta como "restaurant" y "wine_bar" como "bar"
 */
function matchesType(type: string | null, candidate: string): boolean {
  return !!type && (type === candidate || type.endsWith(`_${candidate}`));
}

export function matchesAnyType(type: string | null, candidates: string[]): boolean {
  return candidates.some((candidate) => matchesType(type, candidate));
}

export function getPlaceSetting(type: string | null): PlaceSetting {
  if (matchesAnyType(type, OUTDOOR_TYPES)) return 'outdoor';
  if (matchesAnyType(type, INDOOR_TYPES)) return 'indoor';
  return 'unknown';
}

/**
 * Con lluvia o de noche conviene estar bajo techo; con el cielo despejado de día, al
 * aire libre. Nublado o con niebla el clima no cambia el orden.
 */
export function getWeatherAdvice(weather: Weather | null): WeatherAdvice {
  if (!weather) return null;
  if (RAINY_CONDITIONS.includes(weather.condition) || !weather.isDay) return 'indoor';
  if (SUNNY_CONDITIONS.includes(weather.condition)) return 'outdoor';
  return null;
}

type RankingContext = {
  weather: Weather | null;
  company: string;
};

/**
 * Puntaje = calificación de Google (0 a 5) ± 2 si el lugar encaja o no con el clima
 * + 1 si encaja con la compañía. Se quitan los lugares que no van con la compañía.
 */
export function rankRecommendations(places: Place[], { weather, company }: RankingContext) {
  const advice = getWeatherAdvice(weather);
  const rule = COMPANY_RULES[company];

  const score = (place: Place) => {
    let total = place.rating ?? 0;
    const setting = getPlaceSetting(place.type);
    if (advice && setting !== 'unknown') {
      total += setting === advice ? WEATHER_WEIGHT : -WEATHER_WEIGHT;
    }
    if (rule && matchesAnyType(place.type, rule.preferredTypes)) total += COMPANY_WEIGHT;
    return total;
  };

  return places
    .filter((place) => !rule || !matchesAnyType(place.type, rule.excludedTypes))
    .map((place) => ({ place, score: score(place) }))
    .sort((a, b) => b.score - a.score)
    .map(({ place }) => place);
}

function getWeatherNote(weather: Weather | null, places: Place[]): RecommendationNote | null {
  // Sin resultados la nota del clima no explica nada
  if (places.length === 0) return null;
  if (!weather) return { kind: 'noWeather', text: messages.recommendations.weatherUnavailable };

  const advice = getWeatherAdvice(weather);
  if (!advice) return null;

  const { description, temperature } = weather;
  // La nota describe lo que se muestra: si llueve pero todos los lugares son al aire
  // libre (por ejemplo, solo se eligió "Aire libre"), avisa en lugar de prometer techo
  const hasAdvisedPlaces = places.some((place) => getPlaceSetting(place.type) === advice);
  const recommendations = messages.recommendations;

  if (advice === 'outdoor') {
    return hasAdvisedPlaces
      ? { kind: 'sun', text: recommendations.sunny(description, temperature) }
      : null;
  }
  if (RAINY_CONDITIONS.includes(weather.condition)) {
    return {
      kind: 'rain',
      text: hasAdvisedPlaces
        ? recommendations.rainy(description, temperature)
        : recommendations.rainyOutdoorOnly(description, temperature),
    };
  }
  return {
    kind: 'night',
    text: hasAdvisedPlaces
      ? recommendations.night(temperature)
      : recommendations.nightOutdoorOnly(temperature),
  };
}

/**
 * Notas que explican en pantalla cómo influyeron el clima y la compañía en `places`
 * (los lugares ya ordenados)
 */
export function getRecommendationNotes(
  { weather, company }: RankingContext,
  places: Place[]
): RecommendationNote[] {
  const notes: RecommendationNote[] = [];

  const weatherNote = getWeatherNote(weather, places);
  if (weatherNote) notes.push(weatherNote);

  const companyNote = messages.recommendations.company[company];
  if (companyNote) notes.push({ kind: 'company', text: companyNote });

  return notes;
}
