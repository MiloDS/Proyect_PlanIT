import type { ReactNode } from 'react';
import type { KeyboardTypeOptions, StyleProp, ViewStyle } from 'react-native';

import type { Place } from './places';
import type { Plan } from './plans';
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
