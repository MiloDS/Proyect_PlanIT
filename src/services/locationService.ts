import * as Location from 'expo-location';

import { DevicePosition } from '../types/places';

// Centro de Medellín: se usa si el usuario no da permiso o el GPS no responde a tiempo
const DEFAULT_POSITION: DevicePosition = {
  coordinates: { latitude: 6.2442, longitude: -75.5812 },
  isApproximate: true,
};
const DEFAULT_LABEL = 'Medellín, Colombia';

// Para buscar lugares a unos kilómetros basta una posición reciente o de baja precisión,
// que responden mucho más rápido que esperar al GPS
const LAST_KNOWN_MAX_AGE_MS = 30 * 60 * 1000;
const POSITION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export class LocationService {
  /**
   * Posición actual del usuario. Nunca falla: sin permiso, sin GPS o si tarda
   * más de 8 segundos devuelve el centro de Medellín marcado como aproximado.
   */
  static async getCurrentPosition(): Promise<DevicePosition> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return DEFAULT_POSITION;

      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS })) ??
        (await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          POSITION_TIMEOUT_MS
        ));
      if (!position) return DEFAULT_POSITION;

      return {
        coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        isApproximate: false,
      };
    } catch {
      return DEFAULT_POSITION;
    }
  }

  /**
   * Ciudad y país para mostrar en pantalla (por ejemplo "Medellín, Colombia")
   */
  static async getLocationLabel({ coordinates, isApproximate }: DevicePosition): Promise<string> {
    if (isApproximate) return DEFAULT_LABEL;

    try {
      const [address] = await Location.reverseGeocodeAsync(coordinates);
      const parts = [address?.city ?? address?.subregion, address?.country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Tu ubicación';
    } catch {
      return 'Tu ubicación';
    }
  }
}
