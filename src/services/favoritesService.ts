import { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '../utils/supabase';
import { messages } from '../utils/messages';

export type FavoriteEntry = {
  id: string;
  createdAt: string;
};

const UNIQUE_VIOLATION = '23505';

function toFavoritesError(error: PostgrestError, message: string): Error {
  console.warn(`Favoritos: ${message}`, error.message);
  return new Error(message);
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

    if (error) throw toFavoritesError(error, messages.favorites.loadPlacesFailed);
    return data.map((row) => ({ id: row.place_id, createdAt: row.created_at }));
  }

  static async addPlace(placeId: string): Promise<void> {
    const { error } = await supabase.from('favorites').insert({ place_id: placeId });
    // Ya estaba guardado (por ejemplo, desde otro teléfono)
    if (error && error.code !== UNIQUE_VIOLATION) {
      throw toFavoritesError(error, messages.favorites.addPlaceFailed);
    }
  }

  static async removePlace(placeId: string): Promise<void> {
    const { error } = await supabase.from('favorites').delete().eq('place_id', placeId);
    if (error) throw toFavoritesError(error, messages.favorites.removePlaceFailed);
  }

  static async listPlans(): Promise<FavoriteEntry[]> {
    const { data, error } = await supabase
      .from('favorite_plans')
      .select('plan_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw toFavoritesError(error, messages.favorites.loadPlansFailed);
    return data.map((row) => ({ id: row.plan_id, createdAt: row.created_at }));
  }

  static async addPlan(planId: string): Promise<void> {
    const { error } = await supabase.from('favorite_plans').insert({ plan_id: planId });
    if (error && error.code !== UNIQUE_VIOLATION) {
      throw toFavoritesError(error, messages.favorites.addPlanFailed);
    }
  }

  static async removePlan(planId: string): Promise<void> {
    const { error } = await supabase.from('favorite_plans').delete().eq('plan_id', planId);
    if (error) throw toFavoritesError(error, messages.favorites.removePlanFailed);
  }
}
