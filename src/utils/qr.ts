import { create } from 'qrcode/lib/core/qrcode';

// Margen blanco alrededor del QR, en módulos: los lectores lo necesitan para encontrarlo
const QUIET_ZONE = 4;

/**
 * Dibujo de un código QR para SVG: `path` tiene un cuadrado por cada módulo negro, en un
 * lienzo de `size` × `size` módulos que ya incluye el margen
 */
export function getQrDrawing(value: string): { path: string; size: number } {
  const { modules } = create(value, { errorCorrectionLevel: 'M' });
  let path = '';
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
    }
  }
  return { path, size: modules.size + QUIET_ZONE * 2 };
}
