import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { AuthService } from './authService';

/**
 * Login con Google para las pantallas de autenticación.
 * `signIn` ignora toques repetidos mientras el navegador está abierto
 * y devuelve el mensaje de error, o null si salió bien o el usuario canceló.
 */
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);

  // En Android, precargar Chrome Custom Tabs hace que la pantalla de Google abra más rápido
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    WebBrowser.warmUpAsync().catch(() => {});
    return () => {
      WebBrowser.coolDownAsync().catch(() => {});
    };
  }, []);

  const signIn = async (): Promise<string | null> => {
    if (loading) return null;

    setLoading(true);
    try {
      await AuthService.loginWithGoogle();
      return null;
    } catch (err: any) {
      return err.message || 'No se pudo continuar con Google';
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
}
