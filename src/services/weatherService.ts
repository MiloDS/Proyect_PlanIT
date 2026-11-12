import { Coordinates } from '../types/places';
import { Weather } from '../types/weather';
import { describeWeatherCode } from '../utils/weather';
import { messages } from '../utils/messages';

// Open-Meteo no necesita API key: la app lo consulta directamente
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10000;
// Open-Meteo actualiza el clima actual cada 15 minutos
const CACHE_TTL_MS = 15 * 60 * 1000;
const GENERIC_ERROR = messages.weather.loadFailed;

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: {
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
  };
};

const cache = new Map<string, { weather: Weather; fetchedAt: number }>();

/**
 * Dos decimales (~1 km) bastan para el clima, y así no se envía la ubicación exacta
 */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundTemperature(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
}

function toWeather({ current, daily }: ForecastResponse): Weather {
  const temperature = roundTemperature(current?.temperature_2m);
  if (temperature === null || typeof current?.weather_code !== 'number') {
    throw new Error(GENERIC_ERROR);
  }

  return {
    temperature,
    max: roundTemperature(daily?.temperature_2m_max?.[0]),
    min: roundTemperature(daily?.temperature_2m_min?.[0]),
    isDay: current.is_day !== 0,
    ...describeWeatherCode(current.weather_code),
  };
}

export class WeatherService {
  /**
   * Clima actual y temperaturas máxima y mínima de hoy
   */
  static async getCurrent({ latitude, longitude }: Coordinates): Promise<Weather> {
    const lat = roundCoordinate(latitude);
    const lon = roundCoordinate(longitude);
    const key = `${lat},${lon}`;

    const cached = cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.weather;

    const url =
      `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
      '&current=temperature_2m,weather_code,is_day' +
      '&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(GENERIC_ERROR);

      const weather = toWeather(await response.json());
      cache.set(key, { weather, fetchedAt: Date.now() });
      return weather;
    } catch {
      throw new Error(GENERIC_ERROR);
    } finally {
      clearTimeout(timer);
    }
  }
}
