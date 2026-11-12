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
  /** Código para unirse al plan (sin guion); lo ven y comparten todos sus miembros */
  inviteCode: string;
  members: PlanMember[];
  /** Sugerencias de cambios que esperan la respuesta de quien organiza */
  pendingSuggestions: number;
};

/**
 * Cambios que propone un invitado: solo trae lo que cambió. `undefined` = no lo tocó; en el
 * presupuesto y las notas, `null` = proponer quitarlos.
 */
export type PlanChanges = {
  title?: string;
  /** Fecha y hora en formato ISO */
  startsAt?: string;
  transportMode?: TransportMode;
  budgetPerPerson?: number | null;
  notes?: string | null;
  /** Recorrido completo propuesto, en orden, con los minutos en cada lugar */
  places?: { placeIds: string[]; stayMinutes: Record<string, number> };
};

export type PlanSuggestionStatus = 'pending' | 'accepted' | 'rejected';

export type PlanSuggestion = {
  id: string;
  planId: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  /** Mensaje opcional para quien organiza */
  message: string | null;
  changes: PlanChanges;
  status: PlanSuggestionStatus;
  /** Fechas en formato ISO */
  createdAt: string;
  resolvedAt: string | null;
};

/** Una línea del "antes → después" de una sugerencia, comparada con el plan actual */
export type PlanChangeRow = {
  label: string;
  /** Vacío cuando no aplica, por ejemplo al agregar un lugar */
  before: string;
  after: string;
};

/** Resultado de unirse a un plan con su código */
export type JoinPlanResult = {
  planId: string;
  /** La persona ya hacía parte del plan: no cambió nada */
  alreadyMember: boolean;
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
