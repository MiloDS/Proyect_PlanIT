import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
// Import aparte: la regla import/namespace de ESLint no sigue el `export *` de este enum
import { AndroidImportance } from 'expo-notifications';

import { Plan } from '../types/plans';
import { formatTime } from '../utils/date';
import { ReminderSettings, getReminderSettings } from '../utils/storage';

export const REMINDER_OPTIONS = [
  {
    minutesBefore: 30,
    label: '30 minutos antes',
    body: (time: string) => `Empieza en 30 minutos, a las ${time}`,
  },
  {
    minutesBefore: 60,
    label: '1 hora antes',
    body: (time: string) => `Empieza en 1 hora, a las ${time}`,
  },
  {
    minutesBefore: 180,
    label: '3 horas antes',
    body: (time: string) => `Empieza en 3 horas, a las ${time}`,
  },
  {
    minutesBefore: 1440,
    label: '1 día antes',
    body: (time: string) => `Es mañana a las ${time}`,
  },
];

export type ReminderPermission = 'granted' | 'undetermined' | 'denied' | 'blocked';

const CHANNEL_ID = 'plan-reminders';
const ID_PREFIX = 'plan-reminder:';
// iOS guarda como máximo 64 notificaciones programadas por app
const MAX_REMINDERS = 30;

// Si llega un recordatorio con la app abierta, también se muestra
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Android 13+ solo muestra el diálogo de permiso cuando la app ya tiene un canal
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios de planes',
    importance: AndroidImportance.HIGH,
  });
}

function getReminderDate(plan: Plan, minutesBefore: number): Date | null {
  const date = new Date(new Date(plan.startsAt).getTime() - minutesBefore * 60 * 1000);
  // Si la hora del aviso ya pasó, no se programa
  return date.getTime() > Date.now() + 5000 ? date : null;
}

async function cancelReminders(shouldCancel: (planId: string) => boolean = () => true) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(({ identifier }) => identifier.startsWith(ID_PREFIX))
      .filter(({ identifier }) => shouldCancel(identifier.slice(ID_PREFIX.length)))
      .map(({ identifier }) => Notifications.cancelScheduledNotificationAsync(identifier))
  );
}

async function scheduleReminder(plan: Plan, { minutesBefore }: ReminderSettings) {
  const date = getReminderDate(plan, minutesBefore);
  if (!date) return;

  const option =
    REMINDER_OPTIONS.find((item) => item.minutesBefore === minutesBefore) ?? REMINDER_OPTIONS[1];
  await Notifications.scheduleNotificationAsync({
    identifier: `${ID_PREFIX}${plan.id}`,
    content: {
      title: plan.title,
      body: option.body(formatTime(new Date(plan.startsAt))),
      data: { planId: plan.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

// Settings activos y con permiso; si no, null
async function getActiveSettings(): Promise<ReminderSettings | null> {
  const settings = await getReminderSettings();
  if (!settings.enabled) return null;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted ? settings : null;
}

// Las tareas van en fila: así dos sincronizaciones seguidas no se pisan
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  queue = queue.then(task).catch((err: Error) => {
    console.warn('Recordatorios: no se pudieron actualizar', err?.message);
  });
  return queue;
}

/**
 * Recordatorios locales antes de cada plan. Se programan en el teléfono, así que llegan
 * aunque la app esté cerrada; se actualizan cada vez que la app carga los planes.
 */
export const PlanReminders = {
  async getPermission(): Promise<ReminderPermission> {
    const { granted, canAskAgain, status } = await Notifications.getPermissionsAsync();
    if (granted) return 'granted';
    if (!canAskAgain) return 'blocked';
    return status === 'undetermined' ? 'undetermined' : 'denied';
  },

  async requestPermission(): Promise<ReminderPermission> {
    await ensureChannel();
    const current = await PlanReminders.getPermission();
    if (current === 'granted' || current === 'blocked') return current;
    const { granted, canAskAgain } = await Notifications.requestPermissionsAsync();
    if (granted) return 'granted';
    return canAskAgain ? 'denied' : 'blocked';
  },

  /** Vuelve a programar los recordatorios de todos los planes del usuario */
  sync(plans: Plan[]): Promise<void> {
    return enqueue(async () => {
      await cancelReminders();
      const settings = await getActiveSettings();
      if (!settings) return;

      await ensureChannel();
      const upcoming = plans
        .filter((plan) => getReminderDate(plan, settings.minutesBefore))
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .slice(0, MAX_REMINDERS);
      for (const plan of upcoming) await scheduleReminder(plan, settings);
    });
  },

  /** Actualiza el recordatorio de un plan, por ejemplo después de editarlo */
  update(plan: Plan): Promise<void> {
    return enqueue(async () => {
      await cancelReminders((planId) => planId === plan.id);
      const settings = await getActiveSettings();
      if (settings) await scheduleReminder(plan, settings);
    });
  },

  /** Quita el recordatorio de un plan eliminado o del que el usuario salió */
  cancel(planId: string): Promise<void> {
    return enqueue(() => cancelReminders((id) => id === planId));
  },

  /** Al cerrar sesión no deben llegar avisos de los planes de esa cuenta */
  cancelAll(): Promise<void> {
    return enqueue(() => cancelReminders());
  },
};
