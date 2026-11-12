import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { ScreenHeaderProps } from '../types/components';
import { useTheme, ThemeColors } from '../services/ThemeContext';

// Encabezado de las pantallas que se abren encima de las pestañas (Sorpréndeme,
// Recomendaciones, Crear plan): botón para volver, título y subtítulo centrados
export function ScreenHeader({ title, subtitle, onBack, children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={({ pressed }) => [
          styles.backButton,
          { top: insets.top + 8 },
          pressed && styles.backButtonPressed,
        ]}
      >
        <ChevronLeft size={21} color={colors.textBody} />
      </Pressable>

      <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
        {title}
      </Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  header: {
    paddingBottom: 18,
    paddingHorizontal: 64,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.borderStrong,
    transform: [{ scale: 0.95 }],
  },
  title: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    textAlign: 'center',
  },
});
}
