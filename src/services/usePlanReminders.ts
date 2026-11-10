import { useEffect, useRef } from 'react';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { AppStackParamList } from '../types/navigation';
import { getReminderSettings } from '../utils/storage';
import { PlanReminders } from './planReminders';
import { PlansService } from './plansService';

/**
 * Al abrir la app con sesión se reprograman los recordatorios con los planes actuales
 * (pudieron cambiar desde otro teléfono); al cerrar sesión se cancelan.
 * `userId` es undefined mientras Supabase revisa si hay una sesión guardada.
 */
export function usePlanReminderSync(userId: string | null | undefined) {
  useEffect(() => {
    if (userId === undefined) return;
    if (userId === null) {
      PlanReminders.cancelAll();
      return;
    }

    let cancelled = false;
    getReminderSettings()
      .then((settings) => (settings.enabled ? PlansService.list() : null))
      .then((plans) => {
        if (plans && !cancelled) PlanReminders.sync(plans);
      })
      .catch(() => {
        // Sin conexión se mantienen los recordatorios que ya estaban programados
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);
}

/**
 * Al tocar un recordatorio se abre el detalle de ese plan
 */
export function useOpenPlanFromNotification(
  navigationRef: NavigationContainerRefWithCurrent<AppStackParamList>,
  userId: string | null | undefined,
  navigationReady: boolean
) {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response || !userId || !navigationReady) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const { request, date } = response.notification;
    const planId = request.content.data?.planId;
    const key = `${request.identifier}:${date}`;
    if (typeof planId !== 'string' || handled.current === key) return;
    handled.current = key;

    PlansService.get(planId)
      .then((plan) => {
        if (plan && navigationRef.isReady()) navigationRef.navigate('PlanDetail', { plan });
      })
      .catch(() => {
        // Si no se puede cargar el plan, la app se queda donde estaba
      })
      .finally(() => Notifications.clearLastNotificationResponse());
  }, [response, userId, navigationReady, navigationRef]);
}
