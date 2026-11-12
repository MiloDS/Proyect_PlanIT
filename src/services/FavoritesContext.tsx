import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { FavoriteEntry, FavoritesService } from './favoritesService';
import { messages } from '../utils/messages';

type FavoriteKind = 'place' | 'plan';

type FavoritesState = {
  status: 'loading' | 'ready' | 'error';
  places: FavoriteEntry[];
  plans: FavoriteEntry[];
  error: string;
};

type FavoritesContextValue = FavoritesState & {
  isFavoritePlace: (placeId: string) => boolean;
  isFavoritePlan: (planId: string) => boolean;
  togglePlace: (placeId: string) => void;
  togglePlan: (planId: string) => void;
  reload: () => void;
  /** Vuelve a consultar sin quitar los favoritos de la pantalla (deslizar para actualizar) */
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const SERVICE = {
  place: { add: FavoritesService.addPlace, remove: FavoritesService.removePlace },
  plan: { add: FavoritesService.addPlan, remove: FavoritesService.removePlan },
};
const LIST_KEY = { place: 'places', plan: 'plans' } as const;

const loadFavorites = () =>
  Promise.all([FavoritesService.listPlaces(), FavoritesService.listPlans()]);

function initialState(userId: string | null): FavoritesState {
  return { status: userId ? 'loading' : 'ready', places: [], plans: [], error: '' };
}

type FavoritesProviderProps = {
  /** Usuario con sesión; sin sesión no se consulta nada */
  userId: string | null;
  children: ReactNode;
};

/**
 * Favoritos compartidos por todas las pantallas (detalle, buscar, planes y favoritos)
 */
export function FavoritesProvider({ userId, children }: FavoritesProviderProps) {
  const [state, setState] = useState<FavoritesState>(() => initialState(userId));
  const [stateUserId, setStateUserId] = useState(userId);
  const [reloadKey, setReloadKey] = useState(0);
  // Evita que dos toques seguidos sobre el mismo corazón se pisen
  const pending = useRef(new Set<string>());

  // Al cerrar sesión o cambiar de cuenta se descartan los favoritos anteriores
  if (stateUserId !== userId) {
    setStateUserId(userId);
    setState(initialState(userId));
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    loadFavorites()
      .then(([places, plans]) => {
        if (!cancelled) setState({ status: 'ready', places, plans, error: '' });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState((current) => ({ ...current, status: 'error', error: err.message }));
      });

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const contains = (kind: FavoriteKind, id: string) =>
    state[LIST_KEY[kind]].some((entry) => entry.id === id);

  // Se actualiza la pantalla al instante y se deshace si Supabase falla
  const toggle = async (kind: FavoriteKind, id: string) => {
    const key = `${kind}:${id}`;
    if (pending.current.has(key)) return;
    pending.current.add(key);

    const list = LIST_KEY[kind];
    const wasFavorite = contains(kind, id);
    const update = (favorite: boolean) =>
      setState((current) => ({
        ...current,
        [list]: favorite
          ? [{ id, createdAt: new Date().toISOString() }, ...current[list]]
          : current[list].filter((entry) => entry.id !== id),
      }));

    update(!wasFavorite);
    try {
      await (wasFavorite ? SERVICE[kind].remove(id) : SERVICE[kind].add(id));
    } catch (err: any) {
      update(wasFavorite);
      Alert.alert(messages.favorites.alertTitle, err.message);
    } finally {
      pending.current.delete(key);
    }
  };

  const value: FavoritesContextValue = {
    ...state,
    isFavoritePlace: (placeId) => contains('place', placeId),
    isFavoritePlan: (planId) => contains('plan', planId),
    togglePlace: (placeId) => {
      toggle('place', placeId);
    },
    togglePlan: (planId) => {
      toggle('plan', planId);
    },
    reload: () => {
      setState((current) => ({ ...current, status: 'loading', error: '' }));
      setReloadKey((current) => current + 1);
    },
    refresh: async () => {
      if (!userId) return;
      try {
        const [places, plans] = await loadFavorites();
        setState({ status: 'ready', places, plans, error: '' });
      } catch (err: any) {
        setState((current) => ({ ...current, status: 'error', error: err.message }));
      }
    },
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  }
  return context;
}
