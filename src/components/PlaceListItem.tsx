import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { PlaceListItemProps } from '../types/components';
import { PlaceImage } from './PlaceImage';
import { colors } from '../styles/colors';

// Fila de lugar de Recomendaciones, Favoritos y Crear plan
export function PlaceListItem({
  place,
  distanceKm,
  onPress,
  action,
  showRating = true,
}: PlaceListItemProps) {
  const distanceText = distanceKm === null ? null : `${distanceKm.toFixed(1)} km`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[place.name, place.category, distanceText && `a ${distanceText}`]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <PlaceImage uri={place.photoUrl} placeType={place.type} style={styles.image} />

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {place.name}
          </Text>
          {action}
        </View>
        {!!place.category && (
          <Text style={styles.category} numberOfLines={1}>
            {place.category}
          </Text>
        )}

        <View style={styles.bottomRow}>
          <Text style={styles.distance}>{distanceText ?? ''}</Text>
          {showRating && place.rating !== null && (
            <View style={styles.rating}>
              <Star size={13} color={colors.rating} fill={colors.rating} />
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  pressed: {
    opacity: 0.75,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    paddingVertical: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  category: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  distance: {
    fontSize: 12,
    color: colors.textBody,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textBody,
  },
});
