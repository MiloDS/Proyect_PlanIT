import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthLayoutProps } from '../types/components';
import { useTheme, ThemeColors } from '../services/ThemeContext';

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  // Con edge-to-edge la pantalla se dibuja debajo de la barra de estado y de la barra de
  // navegación de Android: sin sumar su alto, el final del formulario ("¿Ya tienes
  // cuenta?") queda tapado por los botones del sistema aunque se deslice hasta abajo
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);

  return (
    // Con edge-to-edge (activo en Expo) Android ya no redimensiona la ventana al abrir el
    // teclado, así que el ajuste se hace también ahí; el ScrollView lleva al campo enfocado
    <KeyboardAvoidingView style={styles.keyboardView} behavior="padding">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 25,
    backgroundColor: colors.background,
  },
  logo: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 30,
  },
});
}
