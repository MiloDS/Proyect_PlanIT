import { supabase } from '../utils/supabase';
import { Profile } from '../types/auth';

export const MAX_NAME_LENGTH = 60;

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
};

function toProfile(row: ProfileRow): Profile {
  return { fullName: row.full_name, avatarUrl: row.avatar_url };
}

/**
 * Perfil público del usuario en Supabase. RLS deja leer cualquier perfil (para los
 * avatares de los planes) y editar solo el propio.
 */
export class ProfileService {
  static async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Perfil: no se pudo cargar', error.message);
      throw new Error('No se pudo cargar tu perfil. Revisa tu conexión e intenta de nuevo.');
    }
    return data ? toProfile(data) : null;
  }

  static async updateFullName(userId: string, fullName: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', userId)
      .select('full_name, avatar_url')
      .maybeSingle();

    if (error) console.warn('Perfil: no se pudo guardar', error.message);
    if (error || !data) {
      throw new Error('No se pudo guardar tu nombre. Revisa tu conexión e intenta de nuevo.');
    }
    return toProfile(data);
  }
}
