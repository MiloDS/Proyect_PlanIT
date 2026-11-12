import AsyncStorage from '@react-native-async-storage/async-storage';

// La sesión del usuario la guarda y renueva Supabase (ver src/utils/supabase.ts)
const ONBOARDING_KEY = 'hasSeenOnboarding';

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
