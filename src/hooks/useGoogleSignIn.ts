import { useState } from 'react';

import { AuthService } from '../services/authService';

/**
 * Login con Google para las pantallas de autenticación.
 * `signIn` ignora toques repetidos mientras el navegador está abierto
 * y devuelve el mensaje de error, o null si salió bien o el usuario canceló.
 */
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);

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
