import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { PlaceCardProps } from '../types/components';

export function PlaceCard({ imageUrl, name, category, distanceKm, onPress }: PlaceCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.category}>{category}</Text>
        <View style={styles.distanceRow}>
          <MapPin size={12} color="#94A3B8" />
          <Text style={styles.distance}>{distanceKm} km</Text>
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
  image: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    marginBottom: 6,
  },
  info: {
    paddingHorizontal: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  category: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distance: {
    fontSize: 11,
    color: '#05A86B',
    fontWeight: '600',
    marginLeft: 3,
  },
});