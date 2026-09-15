import { Ionicons } from '@expo/vector-icons';

export type CustomInputFieldProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
};

export type SocialButtonProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
};