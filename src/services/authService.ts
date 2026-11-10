import { AuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../utils/supabase';
import { messages } from '../utils/messages';
import { LoginRequest, RegisterRequest } from '../types/auth';

// Mensaje para cada código de error de Supabase Auth
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: messages.auth.invalidCredentials,
  email_not_confirmed: messages.auth.emailNotConfirmed,
  user_already_exists: messages.auth.userAlreadyExists,
  weak_password: messages.auth.weakPassword,
  email_address_invalid: messages.auth.emailInvalid,
  over_request_rate_limit: messages.auth.tooManyAttempts,
  over_email_send_rate_limit: messages.auth.tooManyAttempts,
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
    return new AuthServiceError(messages.auth.network, 'network_error');
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

    // En Android la pestaña del navegador no se puede cerrar desde la app. Abriéndola en la
    // misma tarea, Android la cierra sola cuando la redirección vuelve a traer la app al frente
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
      createTask: false,
    });
    if (result.type !== 'success') return false;

    const params = getRedirectParams(result.url);

    if (params.error) {
      throw new AuthServiceError(
        params.error_description || messages.auth.googleFailed,
        params.error
      );
    }

    if (!params.access_token || !params.refresh_token) {
      throw new AuthServiceError(messages.auth.googleNoSession, 'missing_session');
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
