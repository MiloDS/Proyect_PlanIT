// Edge Function de Supabase: lugares cercanos con Google Places API (New).
// La API key vive en los secretos de Supabase (GOOGLE_PLACES_API_KEY), nunca en la app.
// Solo responde a usuarios con sesión iniciada (ver isSignedIn).

const SEARCH_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.primaryTypeDisplayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.googleMapsUri',
  'places.photos',
].join(',');

const DEFAULT_RADIUS_METERS = 5000;
const MIN_RADIUS_METERS = 100;
const MAX_RADIUS_METERS = 50000;
const DEFAULT_RESULTS = 10;
const MAX_RESULTS = 20;
const PHOTO_MAX_WIDTH_PX = 400;

type GooglePlace = {
  id: string;
  displayName?: { text: string };
  primaryTypeDisplayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  googleMapsUri?: string;
  photos?: { name: string }[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isCoordinate(value: unknown, limit: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;
}

// "Verify JWT" también deja pasar la clave pública de la app (rol anónimo), que cualquiera
// puede extraer del APK. Auth solo devuelve un usuario si el token es de una sesión real.
async function isSignedIn(req: Request): Promise<boolean> {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return false;

  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    },
  });
  if (!response.ok) return false;

  const user = await response.json();
  return typeof user?.id === 'string';
}

// skipHttpRedirect devuelve la URL pública de la imagen en lugar de la imagen,
// así la app puede mostrarla sin conocer la API key
async function getPhotoUrl(photoName: string, apiKey: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${PHOTO_MAX_WIDTH_PX}&skipHttpRedirect=true`;
  const response = await fetch(url, { headers: { 'X-Goog-Api-Key': apiKey } });
  if (!response.ok) return null;
  const data = await response.json();
  return data.photoUri ?? null;
}

async function toPlace(
  place: GooglePlace & { location: { latitude: number; longitude: number } },
  apiKey: string,
  includePhotos: boolean
) {
  const photoName = place.photos?.[0]?.name;

  return {
    id: place.id,
    name: place.displayName?.text ?? 'Lugar sin nombre',
    category: place.primaryTypeDisplayName?.text ?? '',
    address: place.formattedAddress ?? null,
    location: place.location,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    priceLevel:
      place.priceLevel && place.priceLevel !== 'PRICE_LEVEL_UNSPECIFIED' ? place.priceLevel : null,
    googleMapsUri: place.googleMapsUri ?? null,
    photoUrl: includePhotos && photoName ? await getPhotoUrl(photoName, apiKey) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  if (!(await isSignedIn(req))) {
    return json({ error: 'Inicia sesión para buscar lugares' }, 401);
  }

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    return json({ error: 'Falta configurar GOOGLE_PLACES_API_KEY en Supabase' }, 500);
  }

  let params;
  try {
    params = await req.json();
  } catch {
    return json({ error: 'El cuerpo de la petición debe ser JSON' }, 400);
  }

  const { location, radiusMeters, includedTypes, maxResults, includePhotos } = params ?? {};

  if (!isCoordinate(location?.latitude, 90) || !isCoordinate(location?.longitude, 180)) {
    return json({ error: 'Ubicación inválida' }, 400);
  }
  if (
    !Array.isArray(includedTypes) ||
    includedTypes.length === 0 ||
    !includedTypes.every((type) => typeof type === 'string')
  ) {
    return json({ error: 'includedTypes debe ser una lista de tipos de lugar' }, 400);
  }

  const response = await fetch(SEARCH_NEARBY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: clamp(Math.round(Number(maxResults)) || DEFAULT_RESULTS, 1, MAX_RESULTS),
      rankPreference: 'POPULARITY',
      languageCode: 'es',
      locationRestriction: {
        circle: {
          center: { latitude: location.latitude, longitude: location.longitude },
          radius: clamp(
            Number(radiusMeters) || DEFAULT_RADIUS_METERS,
            MIN_RADIUS_METERS,
            MAX_RADIUS_METERS
          ),
        },
      },
    }),
  });

  if (!response.ok) {
    console.error('Google Places respondió', response.status, await response.text());
    return json({ error: 'Google Places no respondió correctamente. Intenta de nuevo.' }, 502);
  }

  const data: { places?: GooglePlace[] } = await response.json();
  const places = await Promise.all(
    (data.places ?? [])
      .filter(
        (place): place is GooglePlace & { location: { latitude: number; longitude: number } } =>
          Boolean(place.location)
      )
      .map((place) => toPlace(place, apiKey, includePhotos !== false))
  );

  return json({ places });
});
