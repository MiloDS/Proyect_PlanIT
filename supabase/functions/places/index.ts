// Edge Function de Supabase: lugares con Google Places API (New) y traslados con Google Routes API.
// La API key vive en los secretos de Supabase (GOOGLE_PLACES_API_KEY), nunca en la app. Para los
// traslados se usa GOOGLE_ROUTES_API_KEY si existe; si no, la misma key (con Routes API permitida).
// Solo responde a usuarios con sesión iniciada (ver isSignedIn).
//
// Acciones (campo `action` del cuerpo; sin él se asume "nearby"):
//   nearby  → lugares cercanos por tipo          { location, radiusMeters, includedTypes, maxResults, includePhotos }
//   text    → búsqueda por texto cerca de un punto { query, location, radiusMeters, includedType, maxResults }
//   details → ficha completa de un lugar           { placeId }
//   lookup  → datos básicos de varios lugares      { placeIds }  (favoritos y planes guardan solo el ID)
//   routes  → distancia y tiempo entre lugares     { mode: walk | drive | transit, legs: [{ from, to }] }

const PLACES_API_URL = 'https://places.googleapis.com/v1';
const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

// Campos de las tarjetas y listas (Nearby y Text Search los piden con el prefijo "places.")
const BASIC_FIELDS = [
  'id',
  'displayName',
  'primaryType',
  'primaryTypeDisplayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'googleMapsUri',
  'photos',
];
// Campos extra de la pantalla de detalle
const DETAIL_FIELDS = [
  ...BASIC_FIELDS,
  'currentOpeningHours',
  'regularOpeningHours',
  'editorialSummary',
  'goodForChildren',
  'goodForGroups',
  'restroom',
  'outdoorSeating',
  'allowsDogs',
  'parkingOptions',
  'accessibilityOptions',
];

const DEFAULT_RADIUS_METERS = 5000;
const MIN_RADIUS_METERS = 100;
const MAX_RADIUS_METERS = 50000;
const DEFAULT_RESULTS = 10;
const MAX_RESULTS = 20;
const MAX_LOOKUP_IDS = 20;
const MAX_QUERY_LENGTH = 100;
const PHOTO_MAX_WIDTH_PX = 400;
const DETAIL_PHOTO_MAX_WIDTH_PX = 800;
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,300}$/;
const MAX_ROUTE_LEGS = 10;
// Cómo se mueve el grupo en el plan → modo de viaje de Google Routes
const TRAVEL_MODES: Record<string, string> = { walk: 'WALK', drive: 'DRIVE', transit: 'TRANSIT' };

type LatLng = { latitude: number; longitude: number };

type GooglePlace = {
  id: string;
  displayName?: { text: string };
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
  formattedAddress?: string;
  location?: LatLng;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  googleMapsUri?: string;
  photos?: { name: string }[];
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  editorialSummary?: { text?: string };
  goodForChildren?: boolean;
  goodForGroups?: boolean;
  restroom?: boolean;
  outdoorSeating?: boolean;
  allowsDogs?: boolean;
  parkingOptions?: Record<string, boolean>;
  accessibilityOptions?: { wheelchairAccessibleEntrance?: boolean };
};

type PlaceWithLocation = GooglePlace & { location: LatLng };

type RouteLeg = { from: string; to: string };

class RequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

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

function parseLocation(location: unknown): LatLng {
  const { latitude, longitude } = (location ?? {}) as Partial<LatLng>;
  if (!isCoordinate(latitude, 90) || !isCoordinate(longitude, 180)) {
    throw new RequestError('Ubicación inválida', 400);
  }
  return { latitude, longitude };
}

function parseRadius(radiusMeters: unknown): number {
  return clamp(Number(radiusMeters) || DEFAULT_RADIUS_METERS, MIN_RADIUS_METERS, MAX_RADIUS_METERS);
}

function parseMaxResults(maxResults: unknown): number {
  return clamp(Math.round(Number(maxResults)) || DEFAULT_RESULTS, 1, MAX_RESULTS);
}

function isPlaceId(value: unknown): value is string {
  return typeof value === 'string' && PLACE_ID_PATTERN.test(value);
}

function hasLocation(place: GooglePlace): place is PlaceWithLocation {
  return Boolean(place.location);
}

function isRouteLeg(value: unknown): value is RouteLeg {
  const { from, to } = (value ?? {}) as Partial<RouteLeg>;
  return isPlaceId(from) && isPlaceId(to) && from !== to;
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

async function callGoogle<T>(
  path: string,
  apiKey: string,
  fieldMask: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${PLACES_API_URL}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    console.error('Google Places respondió', response.status, await response.text());
    if (response.status === 404) throw new RequestError('No encontramos ese lugar', 404);
    throw new RequestError('Google Places no respondió correctamente. Intenta de nuevo.', 502);
  }
  return response.json();
}

// skipHttpRedirect devuelve la URL pública de la imagen en lugar de la imagen,
// así la app puede mostrarla sin conocer la API key
async function getPhotoUrl(photoName: string, apiKey: string, maxWidth: number) {
  const url = `${PLACES_API_URL}/${photoName}/media?maxWidthPx=${maxWidth}&skipHttpRedirect=true`;
  const response = await fetch(url, { headers: { 'X-Goog-Api-Key': apiKey } });
  if (!response.ok) return null;
  const data = await response.json();
  return data.photoUri ?? null;
}

async function toPlace(
  place: PlaceWithLocation,
  apiKey: string,
  includePhotos: boolean,
  photoWidth = PHOTO_MAX_WIDTH_PX
) {
  const photoName = place.photos?.[0]?.name;

  return {
    id: place.id,
    name: place.displayName?.text ?? 'Lugar sin nombre',
    type: place.primaryType ?? null,
    category: place.primaryTypeDisplayName?.text ?? '',
    address: place.formattedAddress ?? null,
    location: place.location,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    priceLevel:
      place.priceLevel && place.priceLevel !== 'PRICE_LEVEL_UNSPECIFIED' ? place.priceLevel : null,
    googleMapsUri: place.googleMapsUri ?? null,
    photoUrl: includePhotos && photoName ? await getPhotoUrl(photoName, apiKey, photoWidth) : null,
  };
}

function toPlaces(places: GooglePlace[] | undefined, apiKey: string, includePhotos: boolean) {
  return Promise.all(
    (places ?? []).filter(hasLocation).map((place) => toPlace(place, apiKey, includePhotos))
  );
}

// Servicios que la app muestra como íconos en la ficha del lugar
function getAmenities(place: GooglePlace): string[] {
  const amenities: string[] = [];
  if (place.restroom) amenities.push('restroom');
  if (place.outdoorSeating) amenities.push('outdoorSeating');
  if (place.allowsDogs) amenities.push('allowsDogs');
  if (place.goodForChildren) amenities.push('goodForChildren');
  if (Object.values(place.parkingOptions ?? {}).some(Boolean)) amenities.push('parking');
  if (place.accessibilityOptions?.wheelchairAccessibleEntrance) amenities.push('wheelchair');
  return amenities;
}

async function searchNearby(params: Record<string, unknown>, apiKey: string) {
  const location = parseLocation(params.location);
  const { includedTypes } = params;
  if (
    !Array.isArray(includedTypes) ||
    includedTypes.length === 0 ||
    !includedTypes.every((type) => typeof type === 'string')
  ) {
    throw new RequestError('includedTypes debe ser una lista de tipos de lugar', 400);
  }

  const data = await callGoogle<{ places?: GooglePlace[] }>(
    'places:searchNearby',
    apiKey,
    BASIC_FIELDS.map((field) => `places.${field}`).join(','),
    {
      includedTypes,
      maxResultCount: parseMaxResults(params.maxResults),
      rankPreference: 'POPULARITY',
      languageCode: 'es',
      locationRestriction: {
        circle: { center: location, radius: parseRadius(params.radiusMeters) },
      },
    }
  );

  return { places: await toPlaces(data.places, apiKey, params.includePhotos !== false) };
}

async function searchText(params: Record<string, unknown>, apiKey: string) {
  const location = parseLocation(params.location);
  const query = typeof params.query === 'string' ? params.query.trim() : '';
  if (!query || query.length > MAX_QUERY_LENGTH) {
    throw new RequestError(`Escribe qué buscar (máximo ${MAX_QUERY_LENGTH} caracteres)`, 400);
  }
  const includedType = typeof params.includedType === 'string' ? params.includedType : undefined;

  const data = await callGoogle<{ places?: GooglePlace[] }>(
    'places:searchText',
    apiKey,
    BASIC_FIELDS.map((field) => `places.${field}`).join(','),
    {
      textQuery: query,
      includedType,
      pageSize: parseMaxResults(params.maxResults),
      languageCode: 'es',
      locationBias: {
        circle: { center: location, radius: parseRadius(params.radiusMeters) },
      },
    }
  );

  return { places: await toPlaces(data.places, apiKey, params.includePhotos !== false) };
}

async function getDetails(params: Record<string, unknown>, apiKey: string) {
  if (!isPlaceId(params.placeId)) throw new RequestError('placeId inválido', 400);

  const place = await callGoogle<GooglePlace>(
    `places/${params.placeId}?languageCode=es`,
    apiKey,
    DETAIL_FIELDS.join(',')
  );
  if (!hasLocation(place)) throw new RequestError('No encontramos ese lugar', 404);

  const hours = place.currentOpeningHours ?? place.regularOpeningHours;
  return {
    place: {
      ...(await toPlace(place, apiKey, true, DETAIL_PHOTO_MAX_WIDTH_PX)),
      openNow: hours?.openNow ?? null,
      weekdayHours: hours?.weekdayDescriptions ?? [],
      description: place.editorialSummary?.text ?? null,
      goodForChildren: place.goodForChildren ?? null,
      goodForGroups: place.goodForGroups ?? null,
      amenities: getAmenities(place),
    },
  };
}

async function lookup(params: Record<string, unknown>, apiKey: string) {
  const { placeIds } = params;
  if (!Array.isArray(placeIds) || placeIds.length > MAX_LOOKUP_IDS || !placeIds.every(isPlaceId)) {
    throw new RequestError(`placeIds debe ser una lista de hasta ${MAX_LOOKUP_IDS} IDs`, 400);
  }

  // Un lugar que Google ya no tiene (cerrado o eliminado) no impide mostrar el resto
  const results = await Promise.allSettled(
    [...new Set(placeIds)].map(async (placeId) => {
      const place = await callGoogle<GooglePlace>(
        `places/${placeId}?languageCode=es`,
        apiKey,
        BASIC_FIELDS.join(',')
      );
      return hasLocation(place) ? toPlace(place, apiKey, true) : null;
    })
  );

  return {
    places: results.flatMap((result) =>
      result.status === 'fulfilled' && result.value ? [result.value] : []
    ),
  };
}

// Un tramo del plan: de un lugar al siguiente. Sin ruta posible (por ejemplo, sin transporte
// público entre los dos) devuelve null en distancia y tiempo.
async function computeLeg({ from, to }: RouteLeg, travelMode: string, apiKey: string) {
  const response = await fetch(ROUTES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
    },
    body: JSON.stringify({
      origin: { placeId: from },
      destination: { placeId: to },
      travelMode,
      // Sin tráfico en tiempo real: es la tarifa básica de Routes y el plan suele ser otro día
      ...(travelMode === 'DRIVE' ? { routingPreference: 'TRAFFIC_UNAWARE' } : {}),
      languageCode: 'es',
      units: 'METRIC',
    }),
  });

  if (!response.ok) {
    console.error('Google Routes respondió', response.status, await response.text());
    throw new RequestError('Google Routes no respondió correctamente', 502);
  }
  const data: { routes?: { distanceMeters?: number; duration?: string }[] } = await response.json();
  const route = data.routes?.[0];
  // Google omite los valores en cero (dos lugares en el mismo edificio)
  return {
    from,
    to,
    distanceMeters: route ? (route.distanceMeters ?? 0) : null,
    durationSeconds: route ? parseInt(route.duration ?? '0s', 10) : null,
  };
}

async function computeRoutes(params: Record<string, unknown>, apiKey: string) {
  const travelMode = TRAVEL_MODES[String(params.mode)];
  if (!travelMode) throw new RequestError('mode debe ser walk, drive o transit', 400);
  const { legs } = params;
  if (
    !Array.isArray(legs) ||
    legs.length === 0 ||
    legs.length > MAX_ROUTE_LEGS ||
    !legs.every(isRouteLeg)
  ) {
    throw new RequestError(`legs debe ser una lista de hasta ${MAX_ROUTE_LEGS} tramos`, 400);
  }

  const routesKey = Deno.env.get('GOOGLE_ROUTES_API_KEY') || apiKey;
  const results = await Promise.allSettled(
    legs.map((leg) => computeLeg(leg, travelMode, routesKey))
  );
  // Si fallan todos, lo más probable es que Routes API no esté permitida para la key
  if (results.every((result) => result.status === 'rejected')) {
    throw new RequestError('No se pudieron calcular los traslados. Intenta de nuevo.', 502);
  }

  return {
    legs: results.map((result, index) =>
      result.status === 'fulfilled'
        ? result.value
        : // `failed`: la app puede volver a pedir este tramo más tarde
          { ...legs[index], distanceMeters: null, durationSeconds: null, failed: true }
    ),
  };
}

const ACTIONS: Record<
  string,
  (params: Record<string, unknown>, apiKey: string) => Promise<unknown>
> = {
  nearby: searchNearby,
  text: searchText,
  details: getDetails,
  lookup,
  routes: computeRoutes,
};

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

  let params: Record<string, unknown>;
  try {
    params = (await req.json()) ?? {};
  } catch {
    return json({ error: 'El cuerpo de la petición debe ser JSON' }, 400);
  }

  const action = ACTIONS[typeof params.action === 'string' ? params.action : 'nearby'];
  if (!action) {
    return json({ error: 'Acción desconocida' }, 400);
  }

  try {
    return json(await action(params, apiKey));
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    console.error('Error inesperado', error);
    return json({ error: 'No se pudieron cargar los lugares. Intenta de nuevo.' }, 500);
  }
});
