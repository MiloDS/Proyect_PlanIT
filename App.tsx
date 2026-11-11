import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/services/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// La pantalla de carga se queda hasta que AppNavigator sepa si hay sesión, en lugar de
// pasar por una pantalla en blanco
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
