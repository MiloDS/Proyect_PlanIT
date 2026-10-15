import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { PlaceCardProps } from '../types/components';
import { colors } from '../styles/colors';

export function PlaceCard({ imageUrl, name, category, distanceKm, onPress }: PlaceCardProps) {
  const distanceText = `${distanceKm.toFixed(1)} km`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${category}, a ${distanceText}`}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <MapPin size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {category}
        </Text>
        <View style={styles.distanceRow}>
          <MapPin size={12} color={colors.textMuted} />
          <Text style={styles.distance}>{distanceText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    marginBottom: 6,
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    paddingHorizontal: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  category: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distance: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 3,
  },
});
