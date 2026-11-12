import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';

/*
 * Almacenamiento de la sesión de Supabase (tokens y verificador PKCE) cifrado con AES-256-GCM.
 * Es el patrón que recomienda la guía de Supabase para Expo: SecureStore guarda en el
 * Keystore de Android solo la clave, porque no admite valores grandes, y el texto cifrado
 * va en AsyncStorage. Sin la clave, lo que hay en AsyncStorage no sirve.
 */

const KEY_NAME = 'planit-session-key';
// Marca los valores cifrados; las sesiones guardadas antes del cifrado no la tienen
const ENCRYPTED_PREFIX = 'enc1:';

let keyPromise: Promise<AESEncryptionKey> | null = null;

// Una sola clave para todos los valores; se lee del Keystore una vez por ejecución
function getKey(): Promise<AESEncryptionKey> {
  keyPromise ??= (async () => {
    const stored = await SecureStore.getItemAsync(KEY_NAME);
    if (stored) return AESEncryptionKey.import(stored, 'base64');
    const key = await AESEncryptionKey.generate();
    await SecureStore.setItemAsync(KEY_NAME, await key.encoded('base64'));
    return key;
  })();
  // Si falló (por ejemplo, el Keystore no respondió), el siguiente intento vuelve a probar
  keyPromise.catch(() => {
    keyPromise = null;
  });
  return keyPromise;
}

/** Texto a bytes UTF-8 (los nombres pueden tener tildes o emojis) */
export function utf8Encode(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000)
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
  }
  return Uint8Array.from(bytes);
}

/** Bytes UTF-8 a texto */
export function utf8Decode(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length;) {
    const byte = bytes[i];
    let code: number;
    if (byte < 0x80) {
      code = byte;
      i += 1;
    } else if (byte < 0xe0) {
      code = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
      i += 2;
    } else if (byte < 0xf0) {
      code = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
      i += 3;
    } else {
      code =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      i += 4;
    }
    text += String.fromCodePoint(code);
  }
  return text;
}

async function encrypt(value: string): Promise<string> {
  const sealed = await aesEncryptAsync(utf8Encode(value), await getKey());
  return ENCRYPTED_PREFIX + (await sealed.combined('base64'));
}

async function decrypt(stored: string): Promise<string> {
  const sealed = AESSealedData.fromCombined(stored.slice(ENCRYPTED_PREFIX.length));
  return utf8Decode(await aesDecryptAsync(sealed, await getKey()));
}

// Escrituras pendientes por clave. Cifrar tarda un poco, así que dos escrituras seguidas
// podrían terminar en otro orden y dejar guardada la sesión vieja: se hacen en fila
const pendingWrites = new Map<string, Promise<void>>();

function enqueueWrite(key: string, write: () => Promise<void>): Promise<void> {
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(write);
  pendingWrites.set(key, next);
  next
    .catch(() => {})
    .finally(() => {
      if (pendingWrites.get(key) === next) pendingWrites.delete(key);
    });
  return next;
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    // Lee lo último que se pidió guardar
    await pendingWrites.get(key)?.catch(() => {});
    const stored = await AsyncStorage.getItem(key);
    if (stored === null) return null;

    // Sesión guardada antes del cifrado: se usa tal cual, así nadie tiene que iniciar
    // sesión de nuevo al actualizar la app. Supabase la vuelve a guardar (ya cifrada) en
    // la siguiente renovación del token, a más tardar en una hora
    if (!stored.startsWith(ENCRYPTED_PREFIX)) return stored;

    try {
      return await decrypt(stored);
    } catch (err: any) {
      // Clave perdida o dato alterado (GCM lo detecta): equivale a no tener sesión
      console.warn('Sesión: no se pudo descifrar', err?.message);
      return null;
    }
  },

  setItem(key: string, value: string): Promise<void> {
    return enqueueWrite(key, async () => {
      let stored: string;
      try {
        stored = await encrypt(value);
      } catch (err: any) {
        // Si el cifrado no está disponible se guarda como antes, para no cerrar la sesión
        console.warn('Sesión: se guardó sin cifrar', err?.message);
        stored = value;
      }
      await AsyncStorage.setItem(key, stored);
    });
  },

  removeItem(key: string): Promise<void> {
    return enqueueWrite(key, () => AsyncStorage.removeItem(key));
  },
};
