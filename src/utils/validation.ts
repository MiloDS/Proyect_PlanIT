import { PlanFormErrors } from '../types/plans';
import { messages } from './messages';

/**
 * Reglas de los formularios. Cada función devuelve el mensaje de error del campo, o ''
 * si el valor es válido; las pantallas solo lo muestran. La base de datos vuelve a
 * revisar las reglas importantes (como el largo del título de un plan): esto sirve para
 * avisar antes de enviar.
 */

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_NAME_LENGTH = 60;
// Igual que la restricción de la tabla plans
export const MAX_PLAN_TITLE_LENGTH = 100;
// Supabase deja configurar el largo del código del correo entre 6 y 10 dígitos
export const RESET_CODE_MIN_LENGTH = 6;
export const RESET_CODE_MAX_LENGTH = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_REGEX = /^\d+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isEmpty(value: string): boolean {
  return value.trim().length === 0;
}

export function isSameEmail(first: string, second: string | null | undefined): boolean {
  return !!second && first.trim().toLowerCase() === second.trim().toLowerCase();
}

export function validateName(name: string): string {
  if (isEmpty(name)) return messages.validation.nameRequired;
  if (name.trim().length > MAX_NAME_LENGTH) return messages.validation.tooLong(MAX_NAME_LENGTH);
  return '';
}

export function validateEmail(email: string): string {
  if (isEmpty(email)) return messages.validation.emailRequired;
  if (!isValidEmail(email)) return messages.validation.emailInvalid;
  return '';
}

/** Contraseña para iniciar sesión: solo se revisa que no esté vacía */
export function validatePassword(password: string): string {
  return isEmpty(password) ? messages.validation.passwordRequired : '';
}

/** Código de recuperación de contraseña que llega por correo */
export function validateResetCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return messages.validation.resetCodeRequired;
  if (
    !DIGITS_REGEX.test(trimmed) ||
    trimmed.length < RESET_CODE_MIN_LENGTH ||
    trimmed.length > RESET_CODE_MAX_LENGTH
  ) {
    return messages.validation.resetCodeInvalid(RESET_CODE_MIN_LENGTH, RESET_CODE_MAX_LENGTH);
  }
  return '';
}

/** Contraseña nueva (registro o recuperación): además debe tener el largo mínimo */
export function validateNewPassword(password: string): string {
  if (isEmpty(password)) return messages.validation.passwordRequired;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return messages.validation.passwordTooShort(MIN_PASSWORD_LENGTH);
  }
  return '';
}

export function validatePasswordConfirmation(password: string, confirmation: string): string {
  if (isEmpty(confirmation)) return messages.validation.passwordConfirmationRequired;
  if (confirmation !== password) return messages.validation.passwordsDontMatch;
  return '';
}

type PlanForm = {
  title: string;
  startsAt: Date;
  placeCount: number;
};

/**
 * Un plan necesita nombre, al menos un lugar y una fecha futura. `allowPast` deja
 * cambiar el nombre o los lugares de un plan que ya pasó sin moverlo al futuro.
 */
export function validatePlan(
  { title, startsAt, placeCount }: PlanForm,
  { allowPast = false } = {}
): PlanFormErrors {
  const errors: PlanFormErrors = {};
  const trimmed = title.trim();

  if (!trimmed) errors.title = messages.validation.planTitleRequired;
  else if (trimmed.length > MAX_PLAN_TITLE_LENGTH) {
    errors.title = messages.validation.tooLong(MAX_PLAN_TITLE_LENGTH);
  }
  if (!allowPast && startsAt.getTime() < Date.now()) {
    errors.startsAt = messages.validation.planDateInPast;
  }
  if (placeCount === 0) errors.places = messages.validation.planPlacesRequired;

  return errors;
}
