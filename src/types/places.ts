export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PriceLevel =
  | 'PRICE_LEVEL_FREE'
  | 'PRICE_LEVEL_INEXPENSIVE'
  | 'PRICE_LEVEL_MODERATE'
  | 'PRICE_LEVEL_EXPENSIVE'
  | 'PRICE_LEVEL_VERY_EXPENSIVE';

// Lugar normalizado que devuelve la Edge Function `places` (supabase/functions/places)
export type Place = {
  id: string;
  name: string;
  /** Tipo principal de Google (por ejemplo "park"); decide el ícono del lugar */
  type: string | null;
  category: string;
  address: string | null;
  location: Coordinates;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: PriceLevel | null;
  googleMapsUri: string | null;
  photoUrl: string | null;
};

export type Amenity =
  'restroom' | 'outdoorSeating' | 'allowsDogs' | 'goodForChildren' | 'parking' | 'wheelchair';

// Ficha completa para la pantalla de detalle (acción "details" de la Edge Function)
export type PlaceDetails = Place & {
  openNow: boolean | null;
  /** Horario de lunes a domingo, por ejemplo "lunes: 6:00 a.m.–6:00 p.m." */
  weekdayHours: string[];
  description: string | null;
  goodForChildren: boolean | null;
  goodForGroups: boolean | null;
  amenities: Amenity[];
};

export type NearbySearchParams = {
  location: Coordinates;
  radiusMeters: number;
  includedTypes: string[];
  maxResults?: number;
  includePhotos?: boolean;
};

export type TextSearchParams = {
  query: string;
  location: Coordinates;
  radiusMeters?: number;
  includedType?: string;
  maxResults?: number;
};

export type SearchCategory = {
  label: string;
  includedTypes: string[];
};

export type RecommendationPreferences = {
  activities: string[];
  budget: string;
  maxDistanceKm: number;
  company: string;
};

// Explica en Recomendaciones cómo influyeron el clima o la compañía en el orden
export type RecommendationNote = {
  kind: 'rain' | 'night' | 'sun' | 'noWeather' | 'company';
  text: string;
};

export type DevicePosition = {
  coordinates: Coordinates;
  isApproximate: boolean;
};
