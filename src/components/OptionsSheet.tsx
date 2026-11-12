import { useRef } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';

import { OptionsSheetProps, SheetOption } from '../types/components';
import { Button } from './Button';
import { useTheme, ThemeColors } from '../services/ThemeContext';

/**
 * Hoja inferior con una lista de acciones, por ejemplo tomar o elegir una foto. Reemplaza
 * a Alert, que en Android solo admite tres botones.
 */
export function OptionsSheet({ visible, title, options, onClose }: OptionsSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  // En iOS no se puede abrir otra pantalla (como la cámara) mientras la hoja se cierra:
  // la acción espera a que termine de cerrarse
  const pendingAction = useRef<(() => void) | null>(null);

  const choose = (option: SheetOption) => {
    if (Platform.OS === 'ios') pendingAction.current = option.onPress;
    onClose();
    if (Platform.OS !== 'ios') option.onPress();
  };

  const runPendingAction = () => {
    pendingAction.current?.();
    pendingAction.current = null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={runPendingAction}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>

          <ScrollView style={styles.options} bounces={false}>
            {options.map((option) => {
              const color = option.destructive ? colors.danger : colors.textPrimary;
              return (
                <Pressable
                  key={`${option.label}-${option.description ?? ''}`}
                  onPress={() => choose(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !!option.selected }}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                >
                  <option.Icon size={21} color={color} />
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color }]} numberOfLines={2}>
                      {option.label}
                    </Text>
                    {!!option.description && (
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    )}
                  </View>
                  {option.selected && <Check size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>

          <Button style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  options: {
    maxHeight: 420,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 56,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
}
