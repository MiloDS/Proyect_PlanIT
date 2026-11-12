import AsyncStorage from '@react-native-async-storage/async-storage';

// La sesión del usuario la guarda y renueva Supabase (ver src/utils/supabase.ts)
const ONBOARDING_KEY = 'hasSeenOnboarding';
const DARK_MODE_KEY = 'darkMode';

export async function setOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

// Solo para desarrollo: vuelve a mostrar la Intro en el próximo arranque
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

// ─── Preferencia de tema oscuro ───────────────────────────────────────────────

/**
 * Devuelve `true` (dark), `false` (light) o `null` si el usuario nunca eligió
 * (en ese caso la app usa el tema del sistema operativo)
 */
export async function getDarkModeSetting(): Promise<boolean | null> {
  const value = await AsyncStorage.getItem(DARK_MODE_KEY);
  if (value === null) return null;
  return value === 'true';
}

export async function saveDarkModeSetting(isDark: boolean): Promise<void> {
  await AsyncStorage.setItem(DARK_MODE_KEY, isDark ? 'true' : 'false');
}

// Recordatorios de planes: es una preferencia de este teléfono, no de la cuenta
const REMINDERS_KEY = 'planReminders';

export type ReminderSettings = {
  enabled: boolean;
  minutesBefore: number;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: false, minutesBefore: 60 };

export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const value = await AsyncStorage.getItem(REMINDERS_KEY);
    return value
      ? { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(value) }
      : DEFAULT_REMINDER_SETTINGS;
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(settings));
}
