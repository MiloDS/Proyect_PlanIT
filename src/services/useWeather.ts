import { useEffect, useState } from 'react';

import { Coordinates } from '../types/places';
import { Weather } from '../types/weather';
import { WeatherService, roundCoordinate } from './weatherService';

type WeatherResult = {
  /** Coordenadas redondeadas de la última consulta terminada */
  key: string;
  weather: Weather | null;
  error: string;
};

export type WeatherStatus = 'loading' | 'ready' | 'error';

/**
 * Clima en la posición del usuario. Mientras no haya posición queda cargando.
 */
export function useWeather(coordinates: Coordinates | undefined) {
  const latitude = coordinates ? roundCoordinate(coordinates.latitude) : null;
  const longitude = coordinates ? roundCoordinate(coordinates.longitude) : null;
  const key = latitude === null || longitude === null ? '' : `${latitude},${longitude}`;

  const [result, setResult] = useState<WeatherResult>({ key: '', weather: null, error: '' });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (latitude === null || longitude === null) return;
    let cancelled = false;
    const requestKey = `${latitude},${longitude}`;

    WeatherService.getCurrent({ latitude, longitude })
      .then((weather) => {
        if (!cancelled) setResult({ key: requestKey, weather, error: '' });
      })
      .catch((err: Error) => {
        if (!cancelled) setResult({ key: requestKey, weather: null, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, retryCount]);

  const isCurrent = !!key && result.key === key;
  let status: WeatherStatus = 'loading';
  if (isCurrent) status = result.weather ? 'ready' : 'error';

  return {
    status,
    weather: isCurrent ? result.weather : null,
    error: isCurrent ? result.error : '',
    retry: () => {
      setResult((current) => ({ ...current, key: '' }));
      setRetryCount((count) => count + 1);
    },
  };
}
