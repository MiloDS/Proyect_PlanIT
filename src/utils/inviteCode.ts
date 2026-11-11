/**
 * Códigos para unirse a un plan. La base de datos los genera (private.generate_invite_code)
 * con este mismo alfabeto, sin los caracteres que se confunden al leerlos o dictarlos.
 */

export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 8;

// Lo que guarda el QR: solo mayúsculas, números, ":" y "-", así el QR usa el modo
// alfanumérico (el más simple de leer). Si lo lee la cámara del teléfono, se entiende igual.
const QR_PREFIX = 'PLANIT:';

/** "k7p2-qx9m " → "K7P2QX9M" */
export function normalizeInviteCode(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** "K7P2QX9M" → "K7P2-QX9M", más fácil de leer y de escribir mientras se teclea */
export function formatInviteCode(text: string): string {
  const code = normalizeInviteCode(text).slice(0, INVITE_CODE_LENGTH);
  return code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function isInviteCode(text: string): boolean {
  const code = normalizeInviteCode(text);
  return (
    code.length === INVITE_CODE_LENGTH &&
    [...code].every((char) => INVITE_CODE_ALPHABET.includes(char))
  );
}

/** "PLANIT:K7P2-QX9M" */
export function getInviteQrValue(code: string): string {
  return `${QR_PREFIX}${formatInviteCode(code)}`;
}

/** El código de un QR de PlanIt, o null si el QR es de otra cosa */
export function getInviteCodeFromQr(data: string): string | null {
  const text = data.trim().toUpperCase();
  if (!text.startsWith(QR_PREFIX)) return null;
  const code = normalizeInviteCode(text.slice(QR_PREFIX.length));
  return isInviteCode(code) ? code : null;
}
