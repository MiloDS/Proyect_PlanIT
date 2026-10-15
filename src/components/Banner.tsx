import { StyleSheet, Text, View } from 'react-native';
import { CircleAlert, CircleCheck } from 'lucide-react-native';

import { BannerProps } from '../types/components';
import { colors } from '../styles/colors';

const VARIANTS = {
  error: {
    Icon: CircleAlert,
    text: colors.danger,
    background: colors.dangerSurface,
    border: colors.dangerBorder,
  },
  success: {
    Icon: CircleCheck,
    text: colors.success,
    background: colors.successSurface,
    border: colors.successBorder,
  },
};

export function Banner({ type, message }: BannerProps) {
  const { Icon, text, background, border } = VARIANTS[type];

  return (
    <View
      style={[styles.container, { backgroundColor: background, borderColor: border }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon size={18} color={text} />
      <Text style={[styles.message, { color: text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});
