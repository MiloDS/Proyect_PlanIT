import { useCallback, useEffect, useRef, useState } from 'react';

import { PlanSuggestion } from '../types/plans';
import { PlanSuggestionsService } from './planSuggestionsService';

// Las respondidas se muestran unos días, para que quien sugirió vea la respuesta
const ANSWERED_VISIBLE_MS = 3 * 24 * 60 * 60 * 1000;

function isRecentOrPending(suggestion: PlanSuggestion, now: number): boolean {
  if (suggestion.status === 'pending') return true;
  return (
    !!suggestion.resolvedAt && now - new Date(suggestion.resolvedAt).getTime() < ANSWERED_VISIBLE_MS
  );
}

/**
 * Sugerencias de un plan para su detalle: las pendientes y las respondidas hace pocos días.
 * `reload` se llama al mostrar la pantalla y después de responder o retirar una; sin
 * conexión se mantiene la última lista conocida.
 */
export function usePlanSuggestions(planId: string) {
  const [suggestions, setSuggestions] = useState<PlanSuggestion[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      const latest = await PlanSuggestionsService.list(planId);
      const now = Date.now();
      if (mounted.current) setSuggestions(latest.filter((item) => isRecentOrPending(item, now)));
    } catch {
      // Se sigue mostrando la última lista; el detalle del plan funciona sin ella
    }
  }, [planId]);

  return { suggestions, reload };
}
