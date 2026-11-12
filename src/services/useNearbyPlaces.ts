import { useCallback, useEffect, useRef, useState } from 'react';

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
 * `reload` vuelve a pedir ambos mostrando que carga (por ejemplo, tras un error);
 * `refresh` lo hace sin quitar los lugares de la pantalla (deslizar para actualizar).
 */
export function useNearbyPlaces() {
  const [state, setState] = useState<NearbyPlacesState>({
    status: 'loading',
    position: null,
    locationLabel: '',
    places: [],
    error: '',
  });
  // Solo la consulta más reciente cambia la pantalla, por si se actualiza mientras
  // la anterior todavía no termina
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestRequest.current;
    const isLatest = () => request === latestRequest.current;

    const position = await LocationService.getCurrentPosition();
    if (!isLatest()) return;
    setState((current) => ({ ...current, position }));

    // El nombre de la ciudad se resuelve en paralelo: no retrasa la búsqueda de lugares
    LocationService.getLocationLabel(position).then((locationLabel) => {
      if (isLatest()) setState((current) => ({ ...current, locationLabel }));
    });

    try {
      const places = await PlacesService.getNearbyPlaces(position.coordinates);
      if (isLatest()) setState((current) => ({ ...current, status: 'ready', places, error: '' }));
    } catch (err: any) {
      if (isLatest()) {
        setState((current) => ({ ...current, status: 'error', places: [], error: err.message }));
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reload = () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    load();
  };

  return { ...state, reload, refresh: load };
}
