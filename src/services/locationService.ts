import * as Location from 'expo-location';

import { Coordinates, UserLocation } from '../types/places';

// Centro de Medellín: se usa si el usuario no da permiso o el GPS no responde
const DEFAULT_LOCATION: UserLocation = {
  coordinates: { latitude: 6.2442, longitude: -75.5812 },
  label: 'Medellín, Colombia',
  isApproximate: true,
};

// Una posición reciente basta para buscar lugares y responde mucho más rápido que el GPS
const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

async function getLocationLabel(coordinates: Coordinates): Promise<string> {
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinates);
    const parts = [address?.city ?? address?.subregion, address?.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Tu ubicación';
  } catch {
    return 'Tu ubicación';
  }
}

export class LocationService {
  /**
   * Ubicación actual del usuario. Nunca falla: sin permiso o sin GPS
   * devuelve el centro de Medellín marcado como aproximado.
   */
  static async getCurrentLocation(): Promise<UserLocation> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return DEFAULT_LOCATION;

      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      return { coordinates, label: await getLocationLabel(coordinates), isApproximate: false };
    } catch {
      return DEFAULT_LOCATION;
    }
  }
}
