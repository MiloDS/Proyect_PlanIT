import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { PlaceImageProps } from '../types/components';
import { useImageFallback } from '../services/useImageFallback';
import { ThemeColors, useTheme } from '../services/ThemeContext';
import { getPlaceCategoryStyle } from '../utils/placeCategories';

// Foto de un lugar o, si no tiene o no carga, el ícono de su categoría.
// expo-image guarda las fotos en memoria y en disco: al volver a una pantalla no se
// descargan otra vez, y aparecen con un fundido corto en vez de saltar
export function PlaceImage({ uri, placeType, style, iconSize = 24 }: PlaceImageProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { showImage, onError } = useImageFallback(uri);

  if (showImage && uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, style]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
        onError={onError}
      />
    );
  }

  const { Icon, color } = getPlaceCategoryStyle(placeType);
  return (
    <View style={[styles.base, styles.placeholder, style]}>
      <Icon size={iconSize} color={color} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // El mismo fondo mientras la foto carga, para que no quede un hueco blanco
    base: {
      backgroundColor: colors.surfaceMuted,
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
