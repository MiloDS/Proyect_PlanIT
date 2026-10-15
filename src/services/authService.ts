import { request } from './apiClient';
import {
  AuthResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  SocialLoginRequest,
} from '../types/auth';

export class AuthService {
  /**
   * Registro con nombre, correo y contraseña
   * POST /auth/register
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Inicio de sesión con correo y contraseña
   * POST /auth/login
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Login o registro mediante Google
   * POST /auth/social/google
   */
  static async loginWithGoogle(data: SocialLoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/social/google', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Login o registro mediante Apple
   * POST /auth/social/apple
   */
  static async loginWithApple(data: SocialLoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/social/apple', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Renovación de token de acceso mediante refresh token
   * POST /auth/refresh
   */
  static async refreshTokens(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    return request<{ tokens: AuthTokens }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }
}
