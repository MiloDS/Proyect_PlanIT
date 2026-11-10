import { KeyboardAvoidingView, ScrollView, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AuthLayoutProps } from '../types/components';
import { colors } from '../styles/colors';

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    // Con edge-to-edge (activo en Expo) Android ya no redimensiona la ventana al abrir el
    // teclado, así que el ajuste se hace también ahí; el ScrollView lleva al campo enfocado
    <KeyboardAvoidingView style={styles.keyboardView} behavior="padding">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: colors.white,
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
