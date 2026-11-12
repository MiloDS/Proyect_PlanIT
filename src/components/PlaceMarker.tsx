import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { PlaceMarkerProps } from '../types/components';
import { colors } from '../styles/colors';
import { getPlaceCategoryStyle } from '../utils/placeCategories';

// Android convierte el marcador en una imagen; mientras tracksViewChanges esté activo la
// vuelve a dibujar en cada cuadro. Se apaga cuando el ícono SVG ya se pintó.
const TRACK_VIEW_CHANGES_MS = 500;

/**
 * Marcador redondo con el ícono de la categoría del lugar. Para cambiar su aspecto al
 * seleccionarlo, SearchScreen lo vuelve a montar (key con el estado de selección).
 */
export function PlaceMarker({ place, selected, onPress }: PlaceMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const { Icon, color } = getPlaceCategoryStyle(place.type);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), TRACK_VIEW_CHANGES_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={place.location}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={selected ? 2 : 1}
      accessibilityLabel={place.name}
    >
      <View style={[styles.pin, { backgroundColor: color }, selected && styles.selectedPin]}>
        <Icon size={selected ? 20 : 16} color={colors.white} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
  },
});
