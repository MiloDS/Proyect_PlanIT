import { File } from 'expo-file-system';

import { supabase } from '../utils/supabase';
import { messages } from '../utils/messages';
import { Profile } from '../types/auth';

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
};

// Bucket público de Supabase Storage: cada usuario tiene una carpeta con su id
const AVATARS_BUCKET = 'avatars';

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
      throw new Error(messages.profile.loadFailed);
    }
    return data ? toProfile(data) : null;
  }

  static async updateFullName(userId: string, fullName: string): Promise<Profile> {
    return ProfileService.update(
      userId,
      { full_name: fullName.trim() },
      messages.profile.saveNameFailed
    );
  }

  /**
   * Sube la foto (ya reducida por PhotoService) y la deja como foto del perfil. Cada foto
   * tiene un nombre nuevo para que ningún teléfono siga mostrando la anterior desde su caché.
   */
  static async updateAvatar(userId: string, imageUri: string): Promise<Profile> {
    const storage = supabase.storage.from(AVATARS_BUCKET);
    const path = `${userId}/${Date.now()}.jpg`;

    try {
      const body = await new File(imageUri).arrayBuffer();
      const { error } = await storage.upload(path, body, { contentType: 'image/jpeg' });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Perfil: no se pudo subir la foto', err?.message ?? err);
      throw new Error(messages.profile.photoUploadFailed);
    }

    const avatarUrl = storage.getPublicUrl(path).data.publicUrl;
    try {
      const profile = await ProfileService.update(
        userId,
        { avatar_url: avatarUrl },
        messages.profile.photoUploadFailed
      );
      ProfileService.deleteInBackground(() => ProfileService.listAvatars(userId, path));
      return profile;
    } catch (err) {
      // Sin perfil actualizado, la foto recién subida no la usa nadie
      ProfileService.deleteInBackground(async () => [path]);
      throw err;
    }
  }

  /** Quita la foto: en los planes se verán las iniciales de la persona */
  static async removeAvatar(userId: string): Promise<Profile> {
    const profile = await ProfileService.update(
      userId,
      { avatar_url: null },
      messages.profile.photoRemoveFailed
    );
    ProfileService.deleteInBackground(() => ProfileService.listAvatars(userId));
    return profile;
  }

  private static async update(
    userId: string,
    changes: Partial<ProfileRow>,
    failMessage: string
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(changes)
      .eq('id', userId)
      .select('full_name, avatar_url')
      .maybeSingle();

    if (error) console.warn('Perfil: no se pudo guardar', error.message);
    if (error || !data) {
      throw new Error(failMessage);
    }
    return toProfile(data);
  }

  /** Fotos guardadas en la carpeta del usuario, menos `keepPath` */
  private static async listAvatars(userId: string, keepPath?: string): Promise<string[]> {
    const { data, error } = await supabase.storage.from(AVATARS_BUCKET).list(userId);
    if (error) throw error;
    return data.map((file) => `${userId}/${file.name}`).filter((path) => path !== keepPath);
  }

  // Borra fotos sin que la persona espere: si falla, solo quedan archivos de más en Storage
  private static deleteInBackground(getPaths: () => Promise<string[]>) {
    getPaths()
      .then(async (paths) => {
        if (paths.length === 0) return;
        const { error } = await supabase.storage.from(AVATARS_BUCKET).remove(paths);
        if (error) throw error;
      })
      .catch((err) => console.warn('Perfil: no se pudieron borrar fotos', err?.message ?? err));
  }
}
