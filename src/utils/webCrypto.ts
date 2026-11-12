import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';

// Hermes (el motor de JavaScript de Expo Go y del APK) no trae `crypto`. Sin él, supabase-js
// arma el verificador PKCE con Math.random y manda el desafío sin hash ("plain"). Con estas
// dos funciones de expo-crypto usa números aleatorios seguros y SHA-256 ("s256").
// `subtle` solo trae digest. La app no usa supabase.auth.getClaims, que necesitaría además
// importKey y verify: si algún día se usa, hay que agregarlas aquí.

type DigestData = Parameters<typeof digest>[1];

type MinimalWebCrypto = {
  getRandomValues?: typeof getRandomValues;
  subtle?: {
    digest: (algorithm: string | { name: string }, data: DigestData) => Promise<ArrayBuffer>;
  };
};

const scope = globalThis as { crypto?: MinimalWebCrypto };
const webCrypto: MinimalWebCrypto = scope.crypto ?? {};

if (typeof webCrypto.getRandomValues !== 'function') {
  webCrypto.getRandomValues = getRandomValues;
}

if (!webCrypto.subtle) {
  webCrypto.subtle = {
    digest: (algorithm, data) => {
      const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
      return digest(name.toUpperCase() as CryptoDigestAlgorithm, data);
    },
  };
}

if (!scope.crypto) scope.crypto = webCrypto;
