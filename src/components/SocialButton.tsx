import { Text, StyleSheet } from 'react-native';

import { SocialButtonProps } from '../types/components';
import { Button } from './Button';
import { useTheme, ThemeColors } from '../services/ThemeContext';

export function SocialButton({ icon, label, onPress, loading }: SocialButtonProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Button style={styles.button} onPress={onPress} loading={loading} accessibilityLabel={label}>
      {icon}
      <Text style={styles.text}>{label}</Text>
    </Button>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
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
}
