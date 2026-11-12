import { PlanFormErrors } from '../types/plans';
import { formatPesos } from './currency';
import { isInviteCode, normalizeInviteCode } from './inviteCode';
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
// Igual que las restricciones de plans (migración del organizador)
export const MAX_PLAN_NOTES_LENGTH = 500;
export const MAX_BUDGET_PER_PERSON = 10_000_000;
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

/** Código de un plan para unirse ("K7P2-QX9M"; también sin guion o en minúsculas) */
export function validateInviteCode(code: string): string {
  if (!normalizeInviteCode(code)) return messages.validation.inviteCodeRequired;
  if (!isInviteCode(code)) return messages.validation.inviteCodeInvalid;
  return '';
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
  notes: string;
  budgetPerPerson: number | null;
};

/**
 * Un plan necesita nombre, al menos un lugar y una fecha futura; las notas y el presupuesto
 * son opcionales. `allowPast` deja cambiar un plan que ya pasó sin moverlo al futuro.
 */
export function validatePlan(
  { title, startsAt, placeCount, notes, budgetPerPerson }: PlanForm,
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
  if (budgetPerPerson !== null && budgetPerPerson > MAX_BUDGET_PER_PERSON) {
    errors.budget = messages.validation.budgetTooHigh(formatPesos(MAX_BUDGET_PER_PERSON));
  }
  if (notes.trim().length > MAX_PLAN_NOTES_LENGTH) {
    errors.notes = messages.validation.tooLong(MAX_PLAN_NOTES_LENGTH);
  }

  return errors;
}
