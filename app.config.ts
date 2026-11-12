import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Toma la configuración de app.json y le agrega lo que no se guarda en el repositorio.
 * Al compilar en EAS Build (Android o iOS), estas variables salen de las del proyecto en
 * expo.dev (el .env no se sube); en Expo Go no hacen falta.
 */

// Sin estas variables la app se cerraría al abrirse. Por eso la compilación en EAS se
// detiene si falta alguna.
const REQUIRED_BUILD_VARIABLES = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];

// En Android el mapa de Buscar es Google Maps y sin su key se cierra al entrar. En iOS el
// mapa es Apple Maps, que no usa key.
const REQUIRED_ANDROID_VARIABLES = ['GOOGLE_MAPS_ANDROID_API_KEY'];

function checkBuildVariables() {
  // EAS_BUILD y EAS_BUILD_PLATFORM solo existen en los servidores de EAS Build
  if (!process.env.EAS_BUILD) return;

  const required =
    process.env.EAS_BUILD_PLATFORM === 'android'
      ? [...REQUIRED_BUILD_VARIABLES, ...REQUIRED_ANDROID_VARIABLES]
      : REQUIRED_BUILD_VARIABLES;
  const missing = required.filter((name) => !process.env[name]);
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
