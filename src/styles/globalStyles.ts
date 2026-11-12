import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { ThemeColors } from '../services/ThemeContext';

export function makeGlobalStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    primaryButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    primaryButtonText: {
      color: themeColors.white,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
