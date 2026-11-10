import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudOff,
  CloudRain,
  CloudSnow,
  CloudSun,
  LucideIcon,
  Moon,
  Sun,
} from 'lucide-react-native';

import { WeatherCardProps } from '../types/components';
import { Weather, WeatherCondition } from '../types/weather';
import { colors } from '../styles/colors';

const ICONS: Record<WeatherCondition, { day: LucideIcon; night: LucideIcon }> = {
  clear: { day: Sun, night: Moon },
  partlyCloudy: { day: CloudSun, night: CloudMoon },
  cloudy: { day: Cloud, night: Cloud },
  fog: { day: CloudFog, night: CloudFog },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle },
  rain: { day: CloudRain, night: CloudRain },
  snow: { day: CloudSnow, night: CloudSnow },
  storm: { day: CloudLightning, night: CloudLightning },
};

function getMinMaxLabel({ max, min }: Weather): string | null {
  if (max === null || min === null) return null;
  return `Máx. ${max}° Mín. ${min}°`;
}

function getAccessibilityLabel(weather: Weather): string {
  const parts = [`Clima: ${weather.temperature} grados, ${weather.description}`];
  if (weather.max !== null && weather.min !== null) {
    parts.push(`máxima de ${weather.max}, mínima de ${weather.min}`);
  }
  return parts.join('. ');
}

// Tarjeta del clima de Inicio: azul de día y más oscura de noche
export function WeatherCard({ status, weather, onRetry }: WeatherCardProps) {
  if (status === 'loading') {
    return (
      <View style={[styles.card, styles.centered]}>
        <ActivityIndicator color={colors.white} />
        <Text style={styles.message}>Cargando el clima…</Text>
      </View>
    );
  }

  if (status === 'error' || !weather) {
    return (
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="No pudimos cargar el clima. Reintentar"
        style={({ pressed }) => [styles.card, styles.centered, pressed && styles.pressed]}
      >
        <CloudOff size={22} color={colors.white} />
        <Text style={styles.message}>No pudimos cargar el clima</Text>
        <Text style={styles.retry}>Reintentar</Text>
      </Pressable>
    );
  }

  const Icon = ICONS[weather.condition][weather.isDay ? 'day' : 'night'];
  const minMax = getMinMaxLabel(weather);

  return (
    <View
      style={[styles.card, !weather.isDay && styles.cardNight]}
      accessible
      accessibilityLabel={getAccessibilityLabel(weather)}
    >
      <View style={styles.info}>
        <Text style={styles.temperature}>{weather.temperature}°C</Text>
        <Text style={styles.description}>{weather.description}</Text>
        {!!minMax && <Text style={styles.minMax}>{minMax}</Text>}
      </View>
      <View style={styles.side}>
        <Icon size={40} color={colors.white} />
        <Text style={styles.attribution}>Open-Meteo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    backgroundColor: colors.weather,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardNight: {
    backgroundColor: colors.weatherNight,
  },
  centered: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.8,
  },
  info: {
    flex: 1,
  },
  temperature: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  description: {
    fontSize: 13,
    color: colors.white,
    marginTop: 2,
  },
  minMax: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  side: {
    alignItems: 'center',
    gap: 8,
  },
  attribution: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)',
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  retry: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    textDecorationLine: 'underline',
  },
});
