export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Datos públicos del usuario (tabla profiles): los ven las personas de sus planes
export type Profile = {
  fullName: string | null;
  avatarUrl: string | null;
};
