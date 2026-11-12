import { WeatherCondition } from '../types/weather';

type WeatherCodeInfo = {
  condition: WeatherCondition;
  description: string;
};

// Códigos de tiempo de la OMM que devuelve Open-Meteo en `weather_code`
const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { condition: 'clear', description: 'Despejado' },
  1: { condition: 'partlyCloudy', description: 'Mayormente despejado' },
  2: { condition: 'partlyCloudy', description: 'Parcialmente nublado' },
  3: { condition: 'cloudy', description: 'Nublado' },
  45: { condition: 'fog', description: 'Niebla' },
  48: { condition: 'fog', description: 'Niebla con escarcha' },
  51: { condition: 'drizzle', description: 'Llovizna ligera' },
  53: { condition: 'drizzle', description: 'Llovizna' },
  55: { condition: 'drizzle', description: 'Llovizna intensa' },
  56: { condition: 'drizzle', description: 'Llovizna helada' },
  57: { condition: 'drizzle', description: 'Llovizna helada intensa' },
  61: { condition: 'rain', description: 'Lluvia ligera' },
  63: { condition: 'rain', description: 'Lluvia' },
  65: { condition: 'rain', description: 'Lluvia fuerte' },
  66: { condition: 'rain', description: 'Lluvia helada' },
  67: { condition: 'rain', description: 'Lluvia helada fuerte' },
  71: { condition: 'snow', description: 'Nevada ligera' },
  73: { condition: 'snow', description: 'Nevada' },
  75: { condition: 'snow', description: 'Nevada fuerte' },
  77: { condition: 'snow', description: 'Nieve granulada' },
  80: { condition: 'rain', description: 'Chubascos ligeros' },
  81: { condition: 'rain', description: 'Chubascos' },
  82: { condition: 'rain', description: 'Chubascos fuertes' },
  85: { condition: 'snow', description: 'Chubascos de nieve' },
  86: { condition: 'snow', description: 'Chubascos de nieve fuertes' },
  95: { condition: 'storm', description: 'Tormenta eléctrica' },
  96: { condition: 'storm', description: 'Tormenta con granizo' },
  99: { condition: 'storm', description: 'Tormenta con granizo fuerte' },
};

export function describeWeatherCode(code: number): WeatherCodeInfo {
  return WEATHER_CODES[code] ?? { condition: 'cloudy', description: 'Clima actual' };
}
