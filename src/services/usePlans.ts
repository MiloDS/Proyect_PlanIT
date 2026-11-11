import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { Plan } from '../types/plans';
import { PlacesService } from './placesService';
import { PlanReminders } from './planReminders';
import { PlansService } from './plansService';

type PlansState = {
  status: 'loading' | 'ready' | 'error';
  plans: Plan[];
  /** Foto de portada por place_id (primer lugar de cada plan) */
  covers: Record<string, string | null>;
  error: string;
};

/**
 * Planes del usuario con la foto de su primer lugar. Se recargan en segundo plano
 * cada vez que la pantalla vuelve a verse (por ejemplo, después de crear un plan).
 */
export function usePlans() {
  const [state, setState] = useState<PlansState>({
    status: 'loading',
    plans: [],
    covers: {},
    error: '',
  });

  const fetchPlans = useCallback(async (isCancelled: () => boolean) => {
    try {
      const plans = await PlansService.list();
      // Los recordatorios siguen los cambios que hayan hecho otras personas del plan
      PlanReminders.sync(plans);
      if (isCancelled()) return;
      setState((current) => ({ ...current, status: 'ready', plans, error: '' }));

      // Las portadas llegan después: la lista se muestra sin esperar a Google
      const coverIds = plans.flatMap((plan) => plan.placeIds.slice(0, 1));
      const places = await PlacesService.lookup(coverIds).catch(() => []);
      if (isCancelled()) return;
      setState((current) => ({
        ...current,
        covers: Object.fromEntries(places.map((place) => [place.id, place.photoUrl])),
      }));
    } catch (err: any) {
      if (!isCancelled()) {
        setState((current) => ({ ...current, status: 'error', error: err.message }));
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchPlans(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [fetchPlans])
  );

  const retry = () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    fetchPlans(() => false);
  };

  // Deslizar para actualizar: la lista actual sigue en pantalla mientras llega la nueva
  const refresh = () => fetchPlans(() => false);

  const getCoverUrl = (plan: Plan) => (plan.placeIds[0] && state.covers[plan.placeIds[0]]) || null;

  return { ...state, retry, refresh, getCoverUrl };
}
