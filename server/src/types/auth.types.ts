export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string | null;
  provider: 'local' | 'google' | 'apple';
  provider_id?: string | null;
  avatar_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  email: string;
  provider: string;
  avatar_url?: string | null;
  created_at: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: UserPublicProfile;
  tokens: TokenPair;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SocialLoginDto {
  token: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}
