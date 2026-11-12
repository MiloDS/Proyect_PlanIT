import { User } from '@supabase/supabase-js';

import { Profile } from '../types/auth';

// El registro guarda `full_name`; Google envía `full_name`/`name` y `avatar_url`
export function getFullName(user: User | null): string {
  const metadata = user?.user_metadata ?? {};
  return metadata.full_name || metadata.name || user?.email?.split('@')[0] || '';
}

export function getAvatarUrl(user: User | null): string | undefined {
  return user?.user_metadata?.avatar_url;
}

/**
 * Nombre que se muestra en la app: el del perfil, que el usuario puede editar y es el
 * que ven los demás en sus planes. Mientras el perfil carga se usa el de la sesión.
 */
export function getDisplayName(user: User | null, profile: Profile | null): string {
  return profile?.fullName?.trim() || getFullName(user);
}

export function getFirstName(name: string): string {
  return name.split(' ')[0];
}

/**
 * Foto que se muestra en la app: la del perfil, que la persona puede cambiar o quitar.
 * Mientras el perfil carga se usa la de la sesión (la de Google, si entró con Google).
 */
export function getDisplayAvatar(user: User | null, profile: Profile | null): string | undefined {
  if (profile) return profile.avatarUrl ?? undefined;
  return getAvatarUrl(user);
}
