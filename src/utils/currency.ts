/**
 * Pesos colombianos sin decimales: "$30.000". Formato propio en lugar de Intl por la misma
 * razón que las fechas (el resultado cambia según la versión de Hermes del teléfono).
 */
export function formatPesos(amount: number): string {
  const digits = String(Math.round(amount));
  return `$${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** Lo que la persona escribió ("30.000", "$ 30000") como número, o null si está vacío */
export function parsePesos(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : null;
}
