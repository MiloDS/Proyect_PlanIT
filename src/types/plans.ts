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

// Errores del formulario de Crear o Editar plan, por campo
export type PlanFormErrors = {
  title?: string;
  startsAt?: string;
  places?: string;
};
