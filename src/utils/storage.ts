import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasSeenOnboarding';
const SESSION_KEY = 'userSession';

export async function setOnboardingSeen() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function saveUserSession(email: string) {
  await AsyncStorage.setItem(SESSION_KEY, email);
}

export async function getUserSession(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function clearUserSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}