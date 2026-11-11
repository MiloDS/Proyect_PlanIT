import { useEffect, useState } from 'react';

import { RouteLeg, TransportMode } from '../types/plans';
import { RoutesService } from './routesService';

type LegsResult = {
  /** Lugares (separados por coma) y modo de la última consulta terminada */
  key: string;
  legs: (RouteLeg | null)[];
  error: string;
};

/**
 * Traslados entre los lugares de un plan, en orden. Mientras cargan se muestran los que ya
 * estaban calculados, así el itinerario no salta al reordenar.
 */
export function useRouteLegs(placeIds: string[], mode: TransportMode) {
  // Los place_id de Google no tienen comas
  const idsKey = placeIds.join(',');
  const key = `${mode}|${idsKey}`;
  const needsLegs = placeIds.length > 1;
  const [result, setResult] = useState<LegsResult>({ key: '', legs: [], error: '' });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length < 2) return;
    let cancelled = false;
    const requestKey = `${mode}|${idsKey}`;

    RoutesService.getLegs(ids, mode)
      .then((legs) => {
        if (!cancelled) setResult({ key: requestKey, legs, error: '' });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            legs: RoutesService.getCachedLegs(ids, mode),
            error: err.message,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey, mode, retryCount]);

  const isCurrent = result.key === key;
  return {
    legs: isCurrent ? result.legs : RoutesService.getCachedLegs(placeIds, mode),
    loading: needsLegs && !isCurrent,
    error: isCurrent ? result.error : '',
    retry: () => {
      setResult((current) => ({ ...current, key: '' }));
      setRetryCount((count) => count + 1);
    },
  };
}
