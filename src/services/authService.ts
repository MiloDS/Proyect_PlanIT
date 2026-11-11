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
  otp_expired: messages.auth.resetCodeExpired,
  same_password: messages.auth.samePassword,
  // Sin un SMTP propio, Supabase solo envía correos al equipo del proyecto
  email_address_not_authorized: messages.auth.emailNotAuthorized,
  // El código de Google ya se usó, venció o se perdió el verificador PKCE
  flow_state_not_found: messages.auth.googleExpired,
  flow_state_expired: messages.auth.googleExpired,
  bad_code_verifier: messages.auth.googleExpired,
  pkce_code_verifier_not_found: messages.auth.googleExpired,
};

// Ruta de la app a la que Supabase devuelve después de Google
const OAUTH_CALLBACK_PATH = 'auth/callback';
// Si canjear el código tarda más, el botón deja de cargar y muestra un error
const OAUTH_EXCHANGE_TIMEOUT_MS = 20000;

// El mismo regreso de Google puede llegar dos veces (al navegador y al listener de
// AuthProvider), y cada código solo se puede canjear una vez
const oauthExchanges = new Map<string, Promise<void>>();

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
 * tanto en la query (?code=...&error=...) como en el fragmento (#error=...).
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

/** Rechaza con `error` si la promesa no termina a tiempo (la petición sigue en curso) */
function withTimeout<T>(promise: Promise<T>, ms: number, error: Error): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(error), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
   * Usa PKCE: Google devuelve un código de un solo uso que solo esta instalación puede
   * canjear, porque el verificador quedó guardado en el teléfono. Devuelve false si el
   * usuario cierra el navegador sin terminar.
   */
  static async loginWithGoogle(): Promise<boolean> {
    const redirectTo = Linking.createURL(OAUTH_CALLBACK_PATH);

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

    if (result.type === 'success') {
      await AuthService.completeOAuthRedirect(result.url);
      return true;
    }

    // En Android la app puede volver al frente un instante antes de que llegue el enlace de
    // regreso: si llega después, lo termina el listener de AuthProvider
    if (__DEV__) console.log(`Google: el navegador terminó sin regresar a la app (${result.type})`);
    return false;
  }

  /** Dice si un enlace que abrió la app es el regreso del inicio de sesión con Google */
  static isOAuthRedirect(url: string): boolean {
    if (!url.includes(OAUTH_CALLBACK_PATH)) return false;
    const params = getRedirectParams(url);
    return !!params.code || !!params.error;
  }

  /**
   * Canjea el código que Google (vía Supabase) devuelve en el enlace de regreso por una
   * sesión. Si el mismo enlace llega otra vez, devuelve el canje que ya está en curso.
   */
  static completeOAuthRedirect(url: string): Promise<void> {
    const params = getRedirectParams(url);

    if (params.error) {
      return Promise.reject(
        new AuthServiceError(params.error_description || messages.auth.googleFailed, params.error)
      );
    }

    const code = params.code;
    if (!code) {
      return Promise.reject(new AuthServiceError(messages.auth.googleNoSession, 'missing_session'));
    }

    const pending = oauthExchanges.get(code);
    if (pending) return pending;

    // Supabase usa el verificador PKCE que guardó al abrir Google en este teléfono
    const exchange = withTimeout(
      supabase.auth.exchangeCodeForSession(code),
      OAUTH_EXCHANGE_TIMEOUT_MS,
      new AuthServiceError(messages.auth.googleTimeout, 'timeout')
    ).then(({ error }) => {
      if (error) throw toAuthServiceError(error);
    });

    oauthExchanges.set(code, exchange);
    return exchange;
  }

  /**
   * Envía al correo el código para crear una contraseña nueva. Supabase responde igual
   * si el correo no tiene cuenta, para no revelar quién usa la app.
   */
  static async sendPasswordResetCode(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw toAuthServiceError(error);
  }

  /**
   * Revisa el código del correo. Si es correcto Supabase abre una sesión de recuperación
   * (evento PASSWORD_RECOVERY) que solo sirve para cambiar la contraseña.
   */
  static async verifyPasswordResetCode(email: string, code: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (error) throw toAuthServiceError(error);
  }

  /**
   * Cambia la contraseña de la sesión actual (después de verificar el código)
   */
  static async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw toAuthServiceError(error);
  }

  /**
   * Cierra la sesión y revoca el refresh token en Supabase
   */
  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw toAuthServiceError(error);
  }
}
