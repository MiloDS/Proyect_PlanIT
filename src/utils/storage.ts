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
