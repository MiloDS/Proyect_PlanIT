export type PlanMember = {
  userId: string;
  role: 'owner' | 'member';
  fullName: string | null;
  avatarUrl: string | null;
};

/** Cómo se mueve el grupo entre los lugares del plan */
export type TransportMode = 'walk' | 'drive' | 'transit';

// Plan de Supabase con sus lugares (solo el place_id de Google) y sus miembros
export type Plan = {
  id: string;
  title: string;
  /** Fecha y hora en formato ISO */
  startsAt: string;
  ownerId: string;
  /** Lugares en el orden del recorrido */
  placeIds: string[];
  /** Minutos que se quedan en cada lugar, por place_id */
  stayMinutes: Record<string, number>;
  transportMode: TransportMode;
  /** Presupuesto aproximado por persona, en pesos */
  budgetPerPerson: number | null;
  notes: string | null;
  members: PlanMember[];
};

export type NewPlan = {
  title: string;
  startsAt: Date;
  placeIds: string[];
  stayMinutes: Record<string, number>;
  transportMode: TransportMode;
  budgetPerPerson: number | null;
  notes: string;
};

// Errores del formulario de Crear o Editar plan, por campo
export type PlanFormErrors = {
  title?: string;
  startsAt?: string;
  places?: string;
  budget?: string;
  notes?: string;
};

/** Traslado de un lugar al siguiente (Google Routes); null si Google no encontró ruta */
export type RouteLeg = {
  from: string;
  to: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
};

// Horario del plan calculado con las estadías y los traslados (utils/itinerary.ts)
export type ItineraryStop = {
  placeId: string;
  stayMinutes: number;
  arrivesAt: Date;
  leavesAt: Date;
};

export type Itinerary = {
  stops: ItineraryStop[];
  /** Hora en que sale del último lugar; null si el plan no tiene lugares */
  endsAt: Date | null;
  travelMinutes: number;
  distanceMeters: number;
  /** Traslados sin tiempo (cargando o sin ruta): la hora de fin no los cuenta */
  unknownLegs: number;
};
