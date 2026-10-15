import { Text, StyleSheet } from 'react-native';

import { SocialButtonProps } from '../types/components';
import { Button } from './Button';
import { colors } from '../styles/colors';

export function SocialButton({ icon, label, onPress, loading }: SocialButtonProps) {
  return (
    <Button style={styles.button} onPress={onPress} loading={loading} accessibilityLabel={label}>
      {icon}
      <Text style={styles.text}>{label}</Text>
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  text: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textBody,
  },
});
