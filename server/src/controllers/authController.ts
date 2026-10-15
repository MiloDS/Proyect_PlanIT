import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthController {
  /**
   * POST /auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const name = req.body.name || req.body.fullName;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_NAME', message: 'El nombre es obligatorio.' },
        });
        return;
      }

      if (!email || !EMAIL_REGEX.test(email.trim())) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_EMAIL', message: 'Ingresa un correo electrónico válido.' },
        });
        return;
      }

      if (!password || password.length < 6) {
        res.status(400).json({
          success: false,
          error: { code: 'WEAK_PASSWORD', message: 'La contraseña debe tener al menos 6 caracteres.' },
        });
        return;
      }

      const result = await AuthService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.code || 'SERVER_ERROR',
          message: err.message || 'Error interno del servidor',
        },
      });
    }
  }

  /**
   * POST /auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Correo y contraseña son obligatorios.' },
        });
        return;
      }

      const result = await AuthService.login({
        email: email.trim(),
        password,
      });

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.code || 'SERVER_ERROR',
          message: err.message || 'Error interno del servidor',
        },
      });
    }
  }

  /**
   * POST /auth/social/google
   * Autenticación con cuenta real de Google/Gmail
   */
  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, avatarUrl, token } = req.body;

      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_GOOGLE_EMAIL', message: 'Debes proporcionar un correo electrónico válido.' },
        });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@googlemail.com')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_GMAIL', message: 'Ingresa un correo de Gmail válido (@gmail.com).' },
        });
        return;
      }

      const result = await AuthService.socialLoginGoogle({
        email: cleanEmail,
        name: name?.trim(),
        avatarUrl,
        token,
      });

      res.status(200).json({
        success: true,
        message: 'Autenticación con Google exitosa',
        data: result,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.code || 'GOOGLE_AUTH_ERROR',
          message: err.message || 'Error al autenticar con Google',
        },
      });
    }
  }

  /**
   * POST /auth/social/apple
   * Autenticación con cuenta real de Apple ID
   */
  static async appleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, avatarUrl, token } = req.body;

      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_APPLE_EMAIL', message: 'Debes proporcionar un correo o Apple ID válido.' },
        });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const result = await AuthService.socialLoginApple({
        email: cleanEmail,
        name: name?.trim(),
        avatarUrl,
        token,
      });

      res.status(200).json({
        success: true,
        message: 'Autenticación con Apple exitosa',
        data: result,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.code || 'APPLE_AUTH_ERROR',
          message: err.message || 'Error al autenticar con Apple',
        },
      });
    }
  }

  /**
   * POST /auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_TOKEN', message: 'El token de actualización es obligatorio.' },
        });
        return;
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token renovado exitosamente',
        data: { tokens },
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.code || 'REFRESH_ERROR',
          message: err.message || 'Error al renovar token',
        },
      });
    }
  }
}
