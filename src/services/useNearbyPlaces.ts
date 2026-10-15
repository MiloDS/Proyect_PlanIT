import { useEffect, useState } from 'react';

import { DevicePosition, Place } from '../types/places';
import { LocationService } from './locationService';
import { PlacesService } from './placesService';

type NearbyPlacesState = {
  status: 'loading' | 'ready' | 'error';
  position: DevicePosition | null;
  locationLabel: string;
  places: Place[];
  error: string;
};

/**
 * Posición del usuario y lugares cercanos para "Cerca de ti".
 * `reload` vuelve a pedir ambos (por ejemplo, tras un error).
 */
export function useNearbyPlaces() {
  const [state, setState] = useState<NearbyPlacesState>({
    status: 'loading',
    position: null,
    locationLabel: '',
    places: [],
    error: '',
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const position = await LocationService.getCurrentPosition();
      if (cancelled) return;
      setState((current) => ({ ...current, position }));

      // El nombre de la ciudad se resuelve en paralelo: no retrasa la búsqueda de lugares
      LocationService.getLocationLabel(position).then((locationLabel) => {
        if (!cancelled) setState((current) => ({ ...current, locationLabel }));
      });

      try {
        const places = await PlacesService.getNearbyPlaces(position.coordinates);
        if (!cancelled) setState((current) => ({ ...current, status: 'ready', places, error: '' }));
      } catch (err: any) {
        if (!cancelled) {
          setState((current) => ({ ...current, status: 'error', places: [], error: err.message }));
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    setReloadKey((key) => key + 1);
  };

  return { ...state, reload };
}
