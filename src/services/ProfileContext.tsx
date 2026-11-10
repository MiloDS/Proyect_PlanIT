import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { Profile } from '../types/auth';
import { ProfileService } from './profileService';
import { messages } from '../utils/messages';

type ProfileContextValue = {
  /** null mientras carga o si no se pudo cargar (la app usa los datos de la sesión) */
  profile: Profile | null;
  updateFullName: (fullName: string) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

type ProfileProviderProps = {
  /** Usuario con sesión; sin sesión no se consulta nada */
  userId: string | null;
  children: ReactNode;
};

/**
 * Perfil del usuario compartido por Inicio, Perfil y la edición del perfil
 */
export function ProfileProvider({ userId, children }: ProfileProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileUserId, setProfileUserId] = useState(userId);

  // Al cerrar sesión o cambiar de cuenta se descarta el perfil anterior
  if (profileUserId !== userId) {
    setProfileUserId(userId);
    setProfile(null);
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    ProfileService.get(userId)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch(() => {
        // Sin perfil se muestran el nombre y la foto de la sesión
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateFullName = async (fullName: string) => {
    if (!userId) throw new Error(messages.profile.signInRequired);
    setProfile(await ProfileService.updateFullName(userId, fullName));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateFullName }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile debe usarse dentro de <ProfileProvider>');
  }
  return context;
}
