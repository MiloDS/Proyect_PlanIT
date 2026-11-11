import { Image, StyleSheet, Text, View } from 'react-native';

import { MemberAvatarProps } from '../types/components';
import { useImageFallback } from '../services/useImageFallback';
import { colors } from '../styles/colors';

function getInitials(name: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

// Foto de la persona o, si no tiene o no carga, sus iniciales sobre el color de la marca
export function MemberAvatar({ name, avatarUrl, size = 32, style }: MemberAvatarProps) {
  const { showImage, onError } = useImageFallback(avatarUrl);

  return (
    <View
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {showImage && avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.image} onError={onError} />
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
