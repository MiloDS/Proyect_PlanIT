import { useState } from 'react';

/**
 * Decide si se muestra una foto remota o su reemplazo (ícono, iniciales): el reemplazo
 * aparece si no hay foto o si la foto no cargó (enlace vencido, sin conexión). Con una
 * dirección nueva se vuelve a intentar.
 */
export function useImageFallback(uri: string | null) {
  const [failedUri, setFailedUri] = useState<string | null>(null);

  return {
    showImage: !!uri && uri !== failedUri,
    onError: () => setFailedUri(uri),
  };
}
