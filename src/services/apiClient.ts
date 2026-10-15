import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ApiResponse } from '../types/auth';

/**
 * Obtiene la URL base de la API automáticamente:
 * - En Expo Go (dispositivo físico): extrae la IP de la máquina de desarrollo desde hostUri.
 * - Fallback: utiliza la IP Wi-Fi local de la máquina (192.168.1.6).
 */
const getApiBaseUrl = (): string => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/v1`;
  }

  // Fallback con la IP local de la computadora para Expo Go en la misma red Wi-Fi
  return 'http://192.168.1.6:3000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export class ApiClientError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = 'API_ERROR', statusCode: number = 400) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      const errorMessage =
        json.error?.message || json.message || 'Error en la petición al servidor';
      const errorCode = json.error?.code || 'UNKNOWN_ERROR';
      throw new ApiClientError(errorMessage, errorCode, response.status);
    }

    return json.data as T;
  } catch (err: any) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    // Error de conexión o red
    throw new ApiClientError(
      err.message || `No se pudo conectar con el servidor en ${API_BASE_URL}`,
      'NETWORK_ERROR',
      0
    );
  }
}
