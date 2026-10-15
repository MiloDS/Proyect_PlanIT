import { User } from '@supabase/supabase-js';

// El registro guarda `full_name`; Google envía `full_name`/`name` y `avatar_url`
export function getFullName(user: User | null): string {
  const metadata = user?.user_metadata ?? {};
  return metadata.full_name || metadata.name || user?.email?.split('@')[0] || '';
}

export function getFirstName(user: User | null): string {
  return getFullName(user).split(' ')[0];
}

export function getAvatarUrl(user: User | null): string | undefined {
  return user?.user_metadata?.avatar_url;
}
