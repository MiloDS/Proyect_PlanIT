import { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { CustomInputFieldProps } from '../types/components';
import { Button } from './Button';
import { useTheme, ThemeColors } from '../services/ThemeContext';

export function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  maxLength,
  multiline,
  error,
}: CustomInputFieldProps) {
  const [hidePassword, setHidePassword] = useState(secureTextEntry ?? false);
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const isPassword = secureTextEntry;
  const PasswordIcon = hidePassword ? EyeOff : Eye;

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          // Solo iOS: el teclado sigue el tema de la app y no el del sistema
          keyboardAppearance={isDark ? 'dark' : 'light'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? hidePassword : false}
          style={[styles.input, multiline && styles.multiline, !!error && styles.inputError]}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          maxLength={maxLength}
          accessibilityLabel={label ?? placeholder}
        />
        {isPassword && (
          <Button
            onPress={() => setHidePassword(!hidePassword)}
            style={styles.icon}
            accessibilityLabel={hidePassword ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          >
            <PasswordIcon size={20} color={colors.textSecondary} />
          </Button>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { marginBottom: 16 },
    label: {
      fontSize: 13,
      color: colors.textBody,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 12,
      minHeight: 52,
      paddingHorizontal: 14,
      paddingRight: 40,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      fontSize: 16,
    },
    multiline: {
      minHeight: 96,
      paddingTop: 14,
      paddingBottom: 14,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
    icon: {
      position: 'absolute',
      right: 12,
      top: 11,
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
