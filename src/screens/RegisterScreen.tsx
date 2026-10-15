import { StyleSheet, View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AppStackParamList } from '../types/navigation';
import { InputField } from '../components/InputField';
import { SocialButton } from '../components/SocialButton';
import { SocialAuthModal } from '../components/SocialAuthModal';
import { Button } from '../components/Button';
import { saveAuthSession } from '../utils/storage';
import { colors } from '../styles/colors';
import { isValidEmail, isEmpty } from '../utils/validation';
import { AuthService } from '../services/authService';

type Props = NativeStackScreenProps<AppStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para el modal de autenticación social real
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'google' | 'apple' | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  const handleRegister = async () => {
    const nextNameError = isEmpty(name) ? 'El nombre es obligatorio' : '';
    const nextEmailError = isEmpty(email)
      ? 'El correo es obligatorio'
      : !isValidEmail(email)
      ? 'Ingresa un correo válido (ejemplo@dominio.com)'
      : '';
    const nextPasswordError = isEmpty(password)
      ? 'La contraseña es obligatoria'
      : password.length < 6
      ? 'La contraseña debe tener al menos 6 caracteres'
      : '';
    const nextConfirmPasswordError = isEmpty(confirmPassword)
      ? 'Confirma tu contraseña'
      : confirmPassword !== password
      ? 'Las contraseñas no coinciden'
      : '';

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setGeneralError('');
    setSuccessMessage('');

    if (nextNameError || nextEmailError || nextPasswordError || nextConfirmPasswordError || loading) {
      return;
    }

    setLoading(true);
    try {
      await AuthService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Mensaje de éxito en verde y redirección al Login
      setSuccessMessage('¡Éxito al registrarse! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        navigation.navigate('Login', { registeredEmail: email.trim() });
      }, 1500);
    } catch (err: any) {
      if (err.code === 'EMAIL_ALREADY_EXISTS') {
        setEmailError('Este correo electrónico ya está registrado.');
      } else {
        setGeneralError(err.message || 'Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoogle = () => {
    setSocialProvider('google');
    setSocialModalVisible(true);
  };

  const handleOpenApple = () => {
    setSocialProvider('apple');
    setSocialModalVisible(true);
  };

  const handleSocialSubmit = async (socialEmail: string, socialName?: string) => {
    setSocialLoading(true);
    setGeneralError('');
    try {
      let response;
      if (socialProvider === 'google') {
        response = await AuthService.loginWithGoogle({
          email: socialEmail,
          name: socialName || name.trim() || undefined,
          token: `google_${socialEmail}`,
        });
      } else {
        response = await AuthService.loginWithApple({
          email: socialEmail,
          name: socialName || name.trim() || undefined,
          token: `apple_${socialEmail}`,
        });
      }

      setSocialModalVisible(false);
      setSuccessMessage('¡Autenticación exitosa! Entrando a la app...');
      await saveAuthSession(response.tokens, response.user);
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }, 1000);
    } catch (err: any) {
      throw err; // El modal maneja y muestra el error
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>¡Crea tu cuenta!</Text>
        <Text style={styles.subtitle}>Regístrate para continuar</Text>

        <SocialButton
          iconName="logo-google"
          iconColor="#4285F4"
          label="Continuar con Google"
          onPress={handleOpenGoogle}
        />

        <SocialButton
          iconName="logo-apple"
          iconColor="#000"
          label="Continuar con Apple"
          onPress={handleOpenApple}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Mensaje de éxito en verde */}
        {!!successMessage && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#15803D" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Mensaje de error general en rojo */}
        {!!generalError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.generalErrorText}>{generalError}</Text>
          </View>
        )}

        <Text style={styles.label}>Nombre completo</Text>
        <InputField
          placeholder="Tu nombre completo"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError('');
            setGeneralError('');
          }}
          autoCapitalize="words"
          autoCorrect={false}
          error={nameError}
        />

        <Text style={styles.label}>Correo electrónico</Text>
        <InputField
          placeholder="ejemplo@correo.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
            setGeneralError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={emailError}
        />

        <Text style={styles.label}>Contraseña</Text>
        <InputField
          placeholder="········"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
            setGeneralError('');
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          error={passwordError}
        />

        <Text style={styles.label}>Confirmar contraseña</Text>
        <InputField
          placeholder="········"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setConfirmPasswordError('');
            setGeneralError('');
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          error={confirmPasswordError}
        />

        <Button style={styles.registerButton} onPress={handleRegister}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.registerButtonText}>Registrarse</Text>
          )}
        </Button>

        <View style={styles.loginPromptRow}>
          <Text style={styles.loginPromptText}>¿Ya tienes cuenta? </Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Inicia sesión"
          >
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal para solicitar correo real de Google o Apple */}
      <SocialAuthModal
        visible={socialModalVisible}
        provider={socialProvider}
        loading={socialLoading}
        onClose={() => setSocialModalVisible(false)}
        onSubmit={handleSocialSubmit}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 30,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 13,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    flex: 1,
    color: '#15803D',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  generalErrorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginPromptText: {
    fontSize: 13,
    color: '#666',
  },
  loginLink: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
});