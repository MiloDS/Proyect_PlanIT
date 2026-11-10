import { useEffect, useState } from 'react';

import { Place } from '../types/places';
import { PlacesService } from './placesService';

type PlaceLookup = {
  /** IDs (separados por coma) de la última consulta terminada */
  key: string;
  places: Record<string, Place>;
  error: string;
};

/**
 * Datos de Google de lugares guardados por ID (la base de datos solo guarda el place_id),
 * en el mismo orden. Si la lista cambia, se consultan solo los que falten.
 */
export function usePlacesById(placeIds: string[]) {
  const idsKey = placeIds.join(',');
  const [lookup, setLookup] = useState<PlaceLookup>({ key: '', places: {}, error: '' });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;

    PlacesService.lookup(idsKey.split(','))
      .then((places) => {
        if (cancelled) return;
        setLookup((current) => ({
          key: idsKey,
          places: { ...current.places, ...Object.fromEntries(places.map((p) => [p.id, p])) },
          error: '',
        }));
      })
      .catch((err: Error) => {
        if (!cancelled) setLookup((current) => ({ ...current, key: idsKey, error: err.message }));
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey, retryKey]);

  const isCurrent = lookup.key === idsKey;
  return {
    places: placeIds.flatMap((id) => (lookup.places[id] ? [lookup.places[id]] : [])),
    loading: !!idsKey && !isCurrent,
    error: isCurrent ? lookup.error : '',
    retry: () => {
      setLookup((current) => ({ ...current, key: '', error: '' }));
      setRetryKey((key) => key + 1);
    },
  };
}
