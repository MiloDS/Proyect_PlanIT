import { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '../utils/supabase';

export type FavoriteEntry = {
  id: string;
  createdAt: string;
};

const UNIQUE_VIOLATION = '23505';

function toFavoritesError(error: PostgrestError, action: string): Error {
  console.warn(`Favoritos: no se pudo ${action}`, error.message);
  return new Error(`No se pudo ${action}. Revisa tu conexión e intenta de nuevo.`);
}

/**
 * Favoritos del usuario en Supabase. RLS garantiza que cada quien solo ve y
 * modifica los suyos, y el user_id lo pone la base de datos (auth.uid()).
 */
export class FavoritesService {
  static async listPlaces(): Promise<FavoriteEntry[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('place_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw toFavoritesError(error, 'cargar tus lugares favoritos');
    return data.map((row) => ({ id: row.place_id, createdAt: row.created_at }));
  }

  static async addPlace(placeId: string): Promise<void> {
    const { error } = await supabase.from('favorites').insert({ place_id: placeId });
    // Ya estaba guardado (por ejemplo, desde otro teléfono)
    if (error && error.code !== UNIQUE_VIOLATION) {
      throw toFavoritesError(error, 'guardar el lugar en favoritos');
    }
  }

  static async removePlace(placeId: string): Promise<void> {
    const { error } = await supabase.from('favorites').delete().eq('place_id', placeId);
    if (error) throw toFavoritesError(error, 'quitar el lugar de favoritos');
  }

  static async listPlans(): Promise<FavoriteEntry[]> {
    const { data, error } = await supabase
      .from('favorite_plans')
      .select('plan_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw toFavoritesError(error, 'cargar tus planes favoritos');
    return data.map((row) => ({ id: row.plan_id, createdAt: row.created_at }));
  }

  static async addPlan(planId: string): Promise<void> {
    const { error } = await supabase.from('favorite_plans').insert({ plan_id: planId });
    if (error && error.code !== UNIQUE_VIOLATION) {
      throw toFavoritesError(error, 'guardar el plan en favoritos');
    }
  }

  static async removePlan(planId: string): Promise<void> {
    const { error } = await supabase.from('favorite_plans').delete().eq('plan_id', planId);
    if (error) throw toFavoritesError(error, 'quitar el plan de favoritos');
  }
}
