import { useRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptionsSheetProps, SheetOption } from '../types/components';
import { Button } from './Button';
import { colors } from '../styles/colors';

/**
 * Hoja inferior con una lista de acciones, por ejemplo tomar o elegir una foto. Reemplaza
 * a Alert, que en Android solo admite tres botones.
 */
export function OptionsSheet({ visible, title, options, onClose }: OptionsSheetProps) {
  const insets = useSafeAreaInsets();
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

          {options.map((option) => {
            const color = option.destructive ? colors.danger : colors.textPrimary;
            return (
              <Pressable
                key={option.label}
                onPress={() => choose(option)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <option.Icon size={21} color={color} />
                <Text style={[styles.optionLabel, { color }]}>{option.label}</Text>
              </Pressable>
            );
          })}

          <Button style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 56,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
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
