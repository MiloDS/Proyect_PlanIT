import { useEffect, useState } from 'react';

import { DevicePosition } from '../types/places';
import { LocationService } from './locationService';

/**
 * Posición del usuario para calcular distancias. Es null mientras se obtiene;
 * nunca falla (ver LocationService.getCurrentPosition).
 */
export function useDevicePosition(): DevicePosition | null {
  const [position, setPosition] = useState<DevicePosition | null>(null);

  useEffect(() => {
    let cancelled = false;
    LocationService.getCurrentPosition().then((current) => {
      if (!cancelled) setPosition(current);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return position;
}
