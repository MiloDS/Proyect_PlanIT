// src/components/Button.tsx
import { Pressable, StyleProp, ViewStyle } from 'react-native';

type ButtonProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function Button({ onPress, style, children }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}