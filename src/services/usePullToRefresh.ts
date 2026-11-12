import { useState } from 'react';

/**
 * Estado del gesto de deslizar hacia abajo para actualizar (RefreshControl): el indicador
 * se muestra mientras `refresh` trabaja, y lo que ya estaba sigue en pantalla.
 */
export function usePullToRefresh(refresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
