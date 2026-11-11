import type { ReactNode } from 'react';
import type { KeyboardTypeOptions, StyleProp, TextInputProps, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { Place } from './places';
import type { Itinerary, Plan, RouteLeg, TransportMode } from './plans';
import type { Weather } from './weather';

export type ButtonProps = {
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'plain' | 'primary';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export type CustomInputFieldProps = {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  /** Permite que el teclado sugiera, por ejemplo, el código que llegó por correo */
  autoComplete?: TextInputProps['autoComplete'];
  maxLength?: number;
  /** Campo de varias líneas, por ejemplo las notas de un plan */
  multiline?: boolean;
  error?: string;
};

export type SocialButtonProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  loading?: boolean;
};

export type GoogleLogoProps = {
  size?: number;
};

export type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export type DividerProps = {
  label?: string;
};

export type BannerProps = {
  type: 'error' | 'success';
  message: string;
};

export type PromptLinkProps = {
  prompt: string;
  linkLabel: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export type PlaceCardProps = {
  imageUrl: string | null;
  name: string;
  category: string;
  distanceKm: number;
  onPress?: () => void;
};

export type CustomSliderProps = {
  minimumValue: number;
  maximumValue: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
};

export type FavoriteButtonProps = {
  isFavorite: boolean;
  onPress: () => void;
  /** Nombre del lugar o plan, para el lector de pantalla */
  itemName: string;
  size?: number;
  /** floating: círculo blanco para ir sobre una foto */
  variant?: 'plain' | 'floating';
};

export type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export type PlaceMarkerProps = {
  place: Place;
  selected: boolean;
  onPress: () => void;
};

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** Contenido extra debajo del título (por ejemplo, un resumen de filtros) */
  children?: ReactNode;
};

export type PlaceListItemProps = {
  place: Place;
  distanceKm: number | null;
  onPress?: () => void;
  /** Botón en la esquina superior derecha (favorito, quitar) */
  action?: ReactNode;
  showRating?: boolean;
};

export type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export type PlanCardProps = {
  plan: Plan;
  /** Foto del primer lugar del plan */
  coverUrl: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress?: () => void;
};

export type MemberAvatarProps = {
  name: string | null;
  avatarUrl: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export type InviteMemberModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Agrega a la persona y devuelve el mensaje para mostrar; lanza un error si no se pudo */
  onInvite: (email: string) => Promise<string>;
};

export type PlacePickerModalProps = {
  visible: boolean;
  selectedIds: string[];
  onToggle: (place: Place) => void;
  onClose: () => void;
};

export type WeatherCardProps = {
  status: 'loading' | 'ready' | 'error';
  weather: Weather | null;
  onRetry: () => void;
};

export type SheetOption = {
  label: string;
  /** Segunda línea en gris, por ejemplo la fecha de un plan */
  description?: string;
  Icon: LucideIcon;
  onPress: () => void;
  /** Opción elegida actualmente: se marca con un visto */
  selected?: boolean;
  /** Acción que borra algo: se muestra en rojo */
  destructive?: boolean;
};

export type OptionsSheetProps = {
  visible: boolean;
  title: string;
  options: SheetOption[];
  onClose: () => void;
};

export type ItineraryListProps = {
  /** Lugares en el orden del recorrido, con su horario en `itinerary.stops` */
  places: Place[];
  itinerary: Itinerary;
  transportMode: TransportMode;
  legs: (RouteLeg | null)[];
  legsLoading: boolean;
  /** Distancia desde la posición del usuario hasta cada lugar */
  getDistanceKm: (place: Place) => number | null;
  onPressPlace?: (place: Place) => void;
  /** Edición (Crear plan); sin estas funciones el itinerario solo se muestra */
  onMove?: (index: number, direction: -1 | 1) => void;
  onRemove?: (index: number) => void;
  onChangeStay?: (index: number) => void;
};

export type ItinerarySummaryProps = {
  itinerary: Itinerary;
  legsLoading: boolean;
  legsError: string;
  onRetryLegs: () => void;
};
