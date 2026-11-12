/**
 * Paletas de colores de la app: clara y oscura.
 * Las pantallas toman la del tema activo con `useTheme()` (services/ThemeContext).
 */

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;

  white: string;
  black: string;
  overlay: string;

  background: string;
  card: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  inactive: string;

  textPrimary: string;
  textBody: string;
  textSecondary: string;
  textMuted: string;

  danger: string;
  dangerSurface: string;
  dangerBorder: string;

  success: string;
  successSurface: string;
  successBorder: string;

  weather: string;
  weatherNight: string;

  // Categorías de lugares (íconos y marcadores del mapa)
  categoryNature: string;
  categoryFood: string;
  categoryCulture: string;
  categoryEntertainment: string;
  categoryOther: string;
  rating: string;
};

export const lightColors: ThemeColors = {
  primary: '#27ae60',
  primaryDark: '#1E8449',
  primaryLight: '#D1FAE5',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.55)',

  background: '#FFFFFF',
  card: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceMuted: '#F1F5F9',
  border: '#F1F5F9',
  borderStrong: '#E2E8F0',
  inactive: '#CBD5E1',

  textPrimary: '#1E293B',
  textBody: '#334155',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  danger: '#DC2626',
  dangerSurface: '#FEE2E2',
  dangerBorder: '#FCA5A5',

  success: '#15803D',
  successSurface: '#DCFCE7',
  successBorder: '#86EFAC',

  weather: '#38BDF8',
  weatherNight: '#1E40AF',

  categoryNature: '#27ae60',
  categoryFood: '#F97316',
  categoryCulture: '#8B5CF6',
  categoryEntertainment: '#EC4899',
  categoryOther: '#3B82F6',
  rating: '#F59E0B',
};

export const darkColors: ThemeColors = {
  primary: '#2ecc71',
  primaryDark: '#27ae60',
  primaryLight: '#064E3B',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.72)',

  background: '#0F172A',
  card: '#1E293B',
  surface: '#1E293B',
  surfaceMuted: '#334155',
  border: '#334155',
  borderStrong: '#475569',
  inactive: '#64748B',

  textPrimary: '#F8FAFC',
  textBody: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  danger: '#F87171',
  dangerSurface: '#450A0A',
  dangerBorder: '#7F1D1D',

  success: '#4ADE80',
  successSurface: '#052E16',
  successBorder: '#14532D',

  weather: '#7DD3FC',
  weatherNight: '#93C5FD',

  categoryNature: '#2ecc71',
  categoryFood: '#FB923C',
  categoryCulture: '#A78BFA',
  categoryEntertainment: '#F472B6',
  categoryOther: '#60A5FA',
  rating: '#FCD34D',
};

/**
 * Paleta clara fija, para lo que no cambia con el tema o vive fuera de los componentes:
 * la pantalla de carga, los marcadores del mapa, el texto blanco sobre verde, etc.
 */
export const colors = lightColors;
