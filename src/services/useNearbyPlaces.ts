import { useEffect, useState } from 'react';

import { Place, UserLocation } from '../types/places';
import { LocationService } from './locationService';
import { PlacesService } from './placesService';

type NearbyPlacesState = {
  status: 'loading' | 'ready' | 'error';
  location: UserLocation | null;
  places: Place[];
  error: string;
};

/**
 * Ubicación del usuario y lugares cercanos para "Cerca de ti".
 * `reload` vuelve a pedir ambos (por ejemplo, tras un error).
 */
export function useNearbyPlaces() {
  const [state, setState] = useState<NearbyPlacesState>({
    status: 'loading',
    location: null,
    places: [],
    error: '',
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const location = await LocationService.getCurrentLocation();
      if (cancelled) return;
      setState((current) => ({ ...current, location }));

      try {
        const places = await PlacesService.getNearbyPlaces(location.coordinates);
        if (!cancelled) setState({ status: 'ready', location, places, error: '' });
      } catch (err: any) {
        if (!cancelled) {
          setState({ status: 'error', location, places: [], error: err.message });
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
