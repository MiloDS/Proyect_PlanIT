// Solo la parte de la librería qrcode que usa la app: el núcleo que arma la matriz del QR.
// Se importa directo para no traer los renderizadores de Node (archivos, PNG).
declare module 'qrcode/lib/core/qrcode' {
  export function create(
    text: string,
    options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }
  ): {
    modules: { size: number; get(row: number, col: number): number | boolean };
  };
}
