import { Ionicons } from '@expo/vector-icons';
import type { KeyboardTypeOptions } from 'react-native';

export type CustomInputFieldProps = {
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
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
};

export type PlaceCardProps = {
  imageUrl: string;
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