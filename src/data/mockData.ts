import { PlaceCardProps } from '../types/components';
import { PlanSummary } from '../types/plans';

// Datos de ejemplo hasta conectar la API de lugares y las tablas de Supabase

export const NEARBY_PLACES: Omit<PlaceCardProps, 'onPress'>[] = [
  {
    name: 'Parque Arví',
    category: 'Parque',
    distanceKm: 2.4,
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Museo de Antioquia',
    category: 'Museo',
    distanceKm: 3.1,
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Café Amor',
    category: 'Cafetería',
    distanceKm: 1.8,
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=400&auto=format&fit=crop',
  },
];

export const UPCOMING_PLANS: PlanSummary[] = [
  {
    id: '1',
    title: 'Tarde con amigos',
    date: '25 may 2025',
    placesCount: 4,
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    avatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    ],
  },
  {
    id: '2',
    title: 'Día de museo',
    date: '15 jun 2025',
    placesCount: 3,
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?q=80&w=800&auto=format&fit=crop',
    avatars: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    ],
  },
  {
    id: '3',
    title: 'Aventura en la montaña',
    date: '28 jun 2025',
    placesCount: 5,
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
    avatars: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
    ],
  },
];

export const PAST_PLANS: PlanSummary[] = [
  {
    id: '4',
    title: 'Ruta gastronómica',
    date: '12 abr 2025',
    placesCount: 3,
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop',
    avatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    ],
  },
];
