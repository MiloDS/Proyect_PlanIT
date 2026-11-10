// Formatos propios en lugar de toLocaleDateString: el resultado de Intl cambia según la
// versión de Hermes/ICU del teléfono ("25 may 2025" vs "25 de may. de 2025")
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "25 may 2025" */
export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Domingo, 25 may 2025" */
export function formatLongDate(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()];
  return `${weekday[0].toUpperCase()}${weekday.slice(1)}, ${formatShortDate(date)}`;
}

/** "4:30 p. m." */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'a. m.' : 'p. m.'}`;
}

export function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Los planes de hoy siguen en "Próximos" hasta que termine el día */
export function isUpcoming(date: Date, now = new Date()): boolean {
  return date >= startOfDay(now);
}
