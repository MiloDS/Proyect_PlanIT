import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, User } from '../types/auth';

const ONBOARDING_KEY = 'hasSeenOnboarding';
const SESSION_KEY = 'userSession';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

export async function setOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function saveUserSession(email: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, email);
}

export async function getUserSession(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function saveAuthSession(tokens: AuthTokens, user: User): Promise<void> {
  await AsyncStorage.multiSet([
    [SESSION_KEY, user.email],
    [ACCESS_TOKEN_KEY, tokens.accessToken],
    [REFRESH_TOKEN_KEY, tokens.refreshToken],
    [USER_DATA_KEY, JSON.stringify(user)],
  ]);
}

export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const values = await AsyncStorage.multiGet([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  return {
    accessToken: values[0][1],
    refreshToken: values[1][1],
  };
}

export async function getUserData(): Promise<User | null> {
  const data = await AsyncStorage.getItem(USER_DATA_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}

export async function clearUserSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    SESSION_KEY,
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_DATA_KEY,
  ]);
}