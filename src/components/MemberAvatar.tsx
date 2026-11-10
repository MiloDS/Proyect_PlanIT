import { Image, StyleSheet, Text, View } from 'react-native';

import { MemberAvatarProps } from '../types/components';
import { colors } from '../styles/colors';

function getInitials(name: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

// Foto de la persona o, si no tiene, sus iniciales sobre el color de la marca
export function MemberAvatar({ name, avatarUrl, size = 32, style }: MemberAvatarProps) {
  return (
    <View
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>
          {getInitials(name) || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontWeight: '700',
    color: colors.white,
  },
});
