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
};

export type SocialButtonProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
};

export type TabName = 'Inicio' | 'Buscar' | 'Planes' | 'Favoritos' | 'Perfil';

export type BottomNavBarProps = {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
};

export type PlaceCardProps = {
  imageUrl: string;
  name: string;
  category: string;
  distanceKm: number;
  onPress?: () => void;
};