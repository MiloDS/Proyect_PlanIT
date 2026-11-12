import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { getDarkModeSetting, saveDarkModeSetting } from '../utils/storage';
import { ThemeColors, darkColors, lightColors } from '../styles/colors';

// Las paletas viven en styles/colors.ts; se reexporta el tipo para las pantallas
export type { ThemeColors };

// ─── Tipo y contexto ──────────────────────────────────────────────────────────

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  // null = preferencia aún no cargada
  const [isDark, setIsDark] = useState<boolean | null>(null);

  // Carga la preferencia guardada; si no hay, respeta el tema del sistema
  useEffect(() => {
    getDarkModeSetting().then((saved) => {
      setIsDark(saved ?? systemScheme === 'dark');
    });
  }, [systemScheme]);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await saveDarkModeSetting(next);
  };

  // Mientras la preferencia carga se usa el tema del sistema para no parpadear
  const resolvedIsDark = isDark ?? systemScheme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        isDark: resolvedIsDark,
        toggleTheme,
        colors: resolvedIsDark ? darkColors : lightColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  }
  return context;
}
