export type WeatherCondition =
  'clear' | 'partlyCloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

// Clima actual y temperaturas del día en la ubicación del usuario (Open-Meteo)
export type Weather = {
  /** Grados Celsius, redondeados */
  temperature: number;
  max: number | null;
  min: number | null;
  isDay: boolean;
  condition: WeatherCondition;
  description: string;
};
