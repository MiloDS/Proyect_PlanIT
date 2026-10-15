import { pool } from '../config/database';
import { User } from '../types/auth.types';

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    const result = await pool.query<User>(
      `INSERT INTO users (name, email, password_hash, provider)
       VALUES ($1, LOWER($2), $3, 'local')
       RETURNING *`,
      [name, email, passwordHash]
    );
    return result.rows[0];
  }

  static async createOrUpdateSocialUser(
    name: string,
    email: string,
    provider: 'google' | 'apple',
    providerId?: string,
    avatarUrl?: string
  ): Promise<User> {
    // Verificar si ya existe usuario con ese email
    const existing = await this.findByEmail(email);

    if (existing) {
      // Si ya existe, actualizamos su provider_id si no lo tenía
      const result = await pool.query<User>(
        `UPDATE users
         SET provider = $1, provider_id = COALESCE($2, provider_id), avatar_url = COALESCE($3, avatar_url), updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [provider, providerId || null, avatarUrl || null, existing.id]
      );
      return result.rows[0];
    }

    // Si no existe, lo creamos
    const result = await pool.query<User>(
      `INSERT INTO users (name, email, provider, provider_id, avatar_url)
       VALUES ($1, LOWER($2), $3, $4, $5)
       RETURNING *`,
      [name, email, provider, providerId || null, avatarUrl || null]
    );
    return result.rows[0];
  }

  static async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  }

  static async findRefreshToken(token: string): Promise<{ user_id: string; expires_at: Date } | null> {
    const result = await pool.query<{ user_id: string; expires_at: Date }>(
      'SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1 LIMIT 1',
      [token]
    );
    return result.rows[0] || null;
  }

  static async deleteRefreshToken(token: string): Promise<void> {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  }
}
