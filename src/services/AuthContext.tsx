import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { Session, User } from '@supabase/supabase-js';

import { AuthService } from './authService';
import { supabase } from '../utils/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  /**
   * Entre el código de recuperación y la contraseña nueva ya hay sesión, pero la persona
   * debe seguir en las pantallas de acceso hasta guardar la contraseña
   */
  isRecoveringPassword: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    // Login, logout y renovación de token pasan por aquí; AppNavigator reacciona solo
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setIsRecoveringPassword(true);
      // Termina al guardar la contraseña nueva o al cancelar (se cierra la sesión)
      else if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') setIsRecoveringPassword(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Regreso del inicio de sesión con Google. Normalmente lo recibe loginWithGoogle, pero
  // si Android trae la app al frente antes que el enlace, o si la app se reinició mientras
  // el navegador estaba abierto (Expo Go la recarga), la sesión se termina aquí
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !AuthService.isOAuthRedirect(url)) return;
      // Un enlace viejo (por ejemplo, al recargar la app) no debe tocar una sesión iniciada
      const { data } = await supabase.auth.getSession();
      if (data.session) return;
      try {
        await AuthService.completeOAuthRedirect(url);
      } catch (err: any) {
        console.warn('Google: no se pudo terminar el inicio de sesión', err?.message);
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, isLoading, isRecoveringPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
