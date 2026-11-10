import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PromptLinkProps } from '../types/components';
import { colors } from '../styles/colors';

export function PromptLink({ prompt, linkLabel, onPress, style }: PromptLinkProps) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.prompt}>{prompt} </Text>
      <Pressable
        onPress={onPress}
        hitSlop={12}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={linkLabel}
      >
        <Text style={styles.link}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  prompt: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  link: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.6,
  },
});
