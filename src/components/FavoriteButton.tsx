import { Pressable, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';

import { FavoriteButtonProps } from '../types/components';
import { colors } from '../styles/colors';

export function FavoriteButton({
  isFavorite,
  onPress,
  itemName,
  size = 20,
  variant = 'plain',
}: FavoriteButtonProps) {
  const idleColor = variant === 'floating' ? colors.textPrimary : colors.textMuted;
  const color = isFavorite ? colors.primary : idleColor;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? `Quitar ${itemName} de favoritos` : `Guardar ${itemName} en favoritos`
      }
      accessibilityState={{ selected: isFavorite }}
      style={({ pressed }) => [
        variant === 'floating' && styles.floating,
        pressed && styles.pressed,
      ]}
    >
      <Heart size={size} color={color} fill={isFavorite ? colors.primary : 'transparent'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floating: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.92 }],
  },
});
