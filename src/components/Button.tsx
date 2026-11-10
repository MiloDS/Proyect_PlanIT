import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ButtonProps } from '../types/components';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

export function Button({
  onPress,
  children,
  style,
  variant = 'plain',
  loading = false,
  disabled = false,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        variant === 'primary' && globalStyles.primaryButton,
        style,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
