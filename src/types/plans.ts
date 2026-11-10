export type PlanMember = {
  userId: string;
  role: 'owner' | 'member';
  fullName: string | null;
  avatarUrl: string | null;
};

// Plan de Supabase con sus lugares (solo el place_id de Google) y sus miembros
export type Plan = {
  id: string;
  title: string;
  /** Fecha y hora en formato ISO */
  startsAt: string;
  ownerId: string;
  placeIds: string[];
  members: PlanMember[];
};

export type NewPlan = {
  title: string;
  startsAt: Date;
  placeIds: string[];
};

/** @deprecated Datos de ejemplo de mockData.ts hasta conectar Mis planes con Supabase */
export type PlanSummary = {
  id: string;
  title: string;
  date: string;
  placesCount: number;
  imageUrl: string;
  avatars: string[];
};
