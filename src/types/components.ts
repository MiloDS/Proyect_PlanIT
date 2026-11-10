import type { ReactNode } from 'react';
import type { KeyboardTypeOptions, StyleProp, ViewStyle } from 'react-native';

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

export type PlaceholderScreenProps = {
  title: string;
};
