import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Toma la configuración de app.json y le agrega lo que no se guarda en el repositorio.
 * Al compilar el APK, EAS Build lee estas variables de las del proyecto en expo.dev
 * (el .env no se sube); en Expo Go no hacen falta.
 */

// Sin estas variables el APK se cerraría: sin Supabase al abrir la app y sin la key de
// Google Maps al entrar a Buscar. Por eso la compilación en EAS se detiene si falta alguna.
const REQUIRED_BUILD_VARIABLES = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'GOOGLE_MAPS_ANDROID_API_KEY',
];

function checkBuildVariables() {
  // EAS_BUILD solo existe en los servidores de EAS Build
  if (!process.env.EAS_BUILD) return;

  const missing = REQUIRED_BUILD_VARIABLES.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno en EAS: ${missing.join(', ')}. Agrégalas en expo.dev (sección "Generar el APK" del README).`
    );
  }
}

export default ({ config }: ConfigContext): Partial<ExpoConfig> => {
  checkBuildVariables();

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      // Key de "Maps SDK for Android" para el mapa de Buscar. Expo Go usa la suya.
      ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
    ],
  };
};
