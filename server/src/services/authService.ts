import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel';
import {
  AuthResponse,
  LoginDto,
  RegisterDto,
  SocialLoginDto,
  TokenPair,
  User,
  UserPublicProfile,
} from '../types/auth.types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_planit';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_planit';
const ACCESS_EXPIRES = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as `${number}m` | `${number}h` | `${number}d`;
const REFRESH_EXPIRES = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as `${number}m` | `${number}h` | `${number}d`;

export class AuthService {
  /**
   * Genera el par de tokens JWT (access y refresh) y guarda el refresh token en la base de datos.
   */
  private static async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: ACCESS_EXPIRES,
    });

    const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRES,
    });

    // Guardar refresh token en PostgreSQL (expira en 7 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await UserModel.saveRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_EXPIRES,
    };
  }

  private static toPublicProfile(user: User): UserPublicProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    };
  }

  /**
   * Registro con correo, contraseña y nombre
   */
  static async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await UserModel.findByEmail(dto.email);
    if (existing) {
      const error: any = new Error('El correo electrónico ya se encuentra registrado');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const newUser = await UserModel.createUser(dto.name, dto.email, passwordHash);
    const tokens = await this.generateTokens(newUser);

    return {
      user: this.toPublicProfile(newUser),
      tokens,
    };
  }

  /**
   * Inicio de sesión clásico con correo y contraseña
   */
  static async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await UserModel.findByEmail(dto.email);
    if (!user) {
      const error: any = new Error('Credenciales inválidas');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.password_hash) {
      const error: any = new Error(
        `Esta cuenta fue creada mediante ${user.provider}. Por favor inicia sesión con ese método.`
      );
      error.statusCode = 400;
      error.code = 'USE_SOCIAL_LOGIN';
      throw error;
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      const error: any = new Error('Credenciales inválidas');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.toPublicProfile(user),
      tokens,
    };
  }

  /**
   * Inicio de sesión / registro con Google utilizando cuenta real
   */
  static async socialLoginGoogle(dto: SocialLoginDto): Promise<AuthResponse> {
    const email = dto.email!.trim().toLowerCase();
    const name = dto.name?.trim() || email.split('@')[0];
    const providerId = dto.token || `google_${email}`;
    const avatarUrl = dto.avatarUrl || null;

    const user = await UserModel.createOrUpdateSocialUser(
      name,
      email,
      'google',
      providerId,
      avatarUrl || undefined
    );

    const tokens = await this.generateTokens(user);

    return {
      user: this.toPublicProfile(user),
      tokens,
    };
  }

  /**
   * Inicio de sesión / registro con Apple utilizando cuenta real
   */
  static async socialLoginApple(dto: SocialLoginDto): Promise<AuthResponse> {
    const email = dto.email!.trim().toLowerCase();
    const name = dto.name?.trim() || email.split('@')[0];
    const providerId = dto.token || `apple_${email}`;
    const avatarUrl = dto.avatarUrl || null;

    const user = await UserModel.createOrUpdateSocialUser(
      name,
      email,
      'apple',
      providerId,
      avatarUrl || undefined
    );

    const tokens = await this.generateTokens(user);

    return {
      user: this.toPublicProfile(user),
      tokens,
    };
  }

  /**
   * Renovación de token de acceso mediante refresh token
   */
  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    const tokenRecord = await UserModel.findRefreshToken(refreshToken);
    if (!tokenRecord || new Date() > tokenRecord.expires_at) {
      const error: any = new Error('Token de actualización expirado o inválido');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const user = await UserModel.findById(tokenRecord.user_id);
    if (!user) {
      const error: any = new Error('Usuario no encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Invalidar token anterior y generar nuevo par
    await UserModel.deleteRefreshToken(refreshToken);
    return this.generateTokens(user);
  }
}
