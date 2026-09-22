import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SocialButtonProps } from '../types/components';
import { Button } from './Button';

export function SocialButton({ iconName, iconColor, label, onPress }: SocialButtonProps) {
  return (
    <Button style={styles.button} onPress={onPress}>
      <Ionicons name={iconName} size={20} color={iconColor} />
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
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  text: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});