import { LogBox } from 'react-native';

// expo-notifications avisa al importarse en Expo Go que las notificaciones push no están
// disponibles. La app solo usa notificaciones locales (recordatorios de planes), que sí
// funcionan, así que esos avisos no se muestran en el recuadro amarillo de la app. Siguen
// apareciendo en la terminal. Se importa antes que App para que aplique desde el inicio.
LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported in Expo Go',
  '[expo-notifications] Push notifications (remote notifications) are unavailable in Expo Go',
]);
