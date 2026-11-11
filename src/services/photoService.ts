import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { messages } from '../utils/messages';

// La foto de perfil se ve a lo sumo a 96 dp: 512 px alcanzan en cualquier pantalla y el
// archivo queda en decenas de KB en lugar de varios MB
const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.8;

export type PhotoSource = 'camera' | 'library';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};

/**
 * Fotos tomadas con la cámara o elegidas de la galería del teléfono
 */
export class PhotoService {
  /**
   * Pide una foto cuadrada (la persona la recorta) y la reduce para subirla.
   * Devuelve la URI local del JPEG, o null si la persona canceló.
   */
  static async pickAvatar(source: PhotoSource): Promise<string | null> {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error(messages.profile.cameraPermissionDenied);
      result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    } else {
      // El selector de fotos del sistema no necesita permiso
      result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    }

    const asset = result.canceled ? null : result.assets[0];
    return asset ? PhotoService.shrink(asset.uri) : null;
  }

  private static async shrink(uri: string): Promise<string> {
    try {
      const image = await ImageManipulator.manipulate(uri)
        .resize({ width: AVATAR_SIZE })
        .renderAsync();
      const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: AVATAR_QUALITY });
      return saved.uri;
    } catch (err) {
      console.warn('Foto: no se pudo preparar', err);
      throw new Error(messages.profile.photoProcessFailed);
    }
  }
}
