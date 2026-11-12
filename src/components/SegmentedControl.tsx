import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SegmentedControlProps } from '../types/components';
import { useTheme, ThemeColors } from '../services/ThemeContext';

// Pestañas de Mis planes (Próximos/Pasados) y Favoritos (Todos/Lugares/Planes)
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 24,
      padding: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentActive: {
      backgroundColor: colors.primary,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 2,
    },
    text: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    textActive: {
      color: colors.white,
      fontWeight: '700',
    },
  });
}
