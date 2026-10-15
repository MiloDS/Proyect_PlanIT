import { StyleSheet, View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
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

type Props = NativeStackScreenProps<AppStackParamList, 'Login'>;

export function LoginScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para el modal de autenticación social real
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'google' | 'apple' | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  // Prellenar email si viene redirigido desde el registro exitoso
  useEffect(() => {
    if (route.params?.registeredEmail) {
      setEmail(route.params.registeredEmail);
      setInfoMessage('¡Cuenta creada exitosamente! Por favor ingresa tu contraseña.');
    }
  }, [route.params?.registeredEmail]);

  const handleLogin = async () => {
    const nextEmailError = isEmpty(email)
      ? 'El correo es obligatorio'
      : !isValidEmail(email)
      ? 'Ingresa un correo válido (ejemplo@dominio.com)'
      : '';

    const nextPasswordError = isEmpty(password) ? 'La contraseña es obligatoria' : '';

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setGeneralError('');

    if (nextEmailError || nextPasswordError || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.login({
        email: email.trim(),
        password,
      });

      await saveAuthSession(response.tokens, response.user);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      setGeneralError(err.message || 'Error al iniciar sesión');
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
          name: socialName || undefined,
          token: `google_${socialEmail}`,
        });
      } else {
        response = await AuthService.loginWithApple({
          email: socialEmail,
          name: socialName || undefined,
          token: `apple_${socialEmail}`,
        });
      }

      setSocialModalVisible(false);
      await saveAuthSession(response.tokens, response.user);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      throw err;
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
        <Text style={styles.title}>¡Bienvenido a PlanIt!</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

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

        {/* Mensaje informativo de registro exitoso previo */}
        {!!infoMessage && (
          <View style={styles.infoContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#15803D" />
            <Text style={styles.infoText}>{infoMessage}</Text>
          </View>
        )}

        {/* Mensaje de error general */}
        {!!generalError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.generalErrorText}>{generalError}</Text>
          </View>
        )}

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

        <Pressable style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </Pressable>

        <Button style={styles.loginButton} onPress={handleLogin}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          )}
        </Button>

        <View style={styles.registerPromptRow}>
          <Text style={styles.registerPromptText}>¿No tienes cuenta? </Text>
          <Pressable
            onPress={() => navigation.navigate('Register')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Regístrate"
          >
            <Text style={styles.registerLink}>Regístrate</Text>
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: '#15803D',
    fontSize: 13,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerPromptText: {
    fontSize: 13,
    color: '#666',
  },
  registerLink: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
});