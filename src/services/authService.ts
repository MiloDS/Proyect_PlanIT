import { AuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../utils/supabase';
import { LoginRequest, RegisterRequest } from '../types/auth';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión.',
  user_already_exists: 'Este correo electrónico ya está registrado.',
  weak_password: 'La contraseña es demasiado débil.',
  email_address_invalid: 'Ingresa un correo válido.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
};

export class AuthServiceError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
  }
}

function toAuthServiceError(error: AuthError): AuthServiceError {
  if (isAuthRetryableFetchError(error)) {
    return new AuthServiceError(
      'No se pudo conectar con el servidor. Revisa tu conexión.',
      'network_error'
    );
  }

  const code = error.code ?? 'unknown_error';
  return new AuthServiceError(AUTH_ERROR_MESSAGES[code] ?? error.message, code);
}

/**
 * Lee los parámetros que Supabase agrega a la URL de retorno del OAuth,
 * tanto en la query (?error=...) como en el fragmento (#access_token=...).
 */
function getRedirectParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const paramString = url.split(/[?#]/).slice(1).join('&');

  for (const pair of paramString.split('&')) {
    if (!pair) continue;
    const [key, value = ''] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  }

  return params;
}

export class AuthService {
  /**
   * Registro con nombre, correo y contraseña.
   * Si "Confirm email" está activo en Supabase no se crea sesión hasta confirmar el correo.
   */
  static async register({
    name,
    email,
    password,
  }: RegisterRequest): Promise<{ needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) throw toAuthServiceError(error);

    // Con "Confirm email" activo, Supabase no devuelve error para un correo ya registrado:
    // responde un usuario sin identidades
    if (data.user?.identities?.length === 0) {
      throw new AuthServiceError(AUTH_ERROR_MESSAGES.user_already_exists, 'user_already_exists');
    }

    return { needsEmailConfirmation: !data.session };
  }

  /**
   * Inicio de sesión con correo y contraseña
   */
  static async login({ email, password }: LoginRequest): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw toAuthServiceError(error);
  }

  /**
   * Login o registro con Google: abre el navegador y guarda la sesión al volver a la app.
   * Devuelve false si el usuario cierra el navegador sin terminar.
   */
  static async loginWithGoogle(): Promise<boolean> {
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error) throw toAuthServiceError(error);

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return false;

    const params = getRedirectParams(result.url);

    if (params.error) {
      throw new AuthServiceError(
        params.error_description || 'No se pudo iniciar sesión con Google.',
        params.error
      );
    }

    if (!params.access_token || !params.refresh_token) {
      throw new AuthServiceError('Google no devolvió una sesión válida.', 'missing_session');
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });

    if (sessionError) throw toAuthServiceError(sessionError);
    return true;
  }

  /**
   * Cierra la sesión y revoca el refresh token en Supabase
   */
  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw toAuthServiceError(error);
  }
}
