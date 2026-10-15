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
  category: string;
  address: string | null;
  location: Coordinates;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: PriceLevel | null;
  googleMapsUri: string | null;
  photoUrl: string | null;
};

export type NearbySearchParams = {
  location: Coordinates;
  radiusMeters: number;
  includedTypes: string[];
  maxResults?: number;
  includePhotos?: boolean;
};

export type RecommendationPreferences = {
  activities: string[];
  budget: string;
  maxDistanceKm: number;
};

export type DevicePosition = {
  coordinates: Coordinates;
  isApproximate: boolean;
};
