import { StyleSheet, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';

import { AppStackParamList } from '../types/navigation';
import { AuthLayout } from '../components/AuthLayout';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { GoogleLogo } from '../components/GoogleLogo';
import { InputField } from '../components/InputField';
import { PromptLink } from '../components/PromptLink';
import { SocialButton } from '../components/SocialButton';
import { useGoogleSignIn } from '../services/useGoogleSignIn';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
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
  const google = useGoogleSignIn();

  // Prellenar email si viene redirigido desde el registro exitoso
  useEffect(() => {
    if (route.params?.registeredEmail) {
      setEmail(route.params.registeredEmail);
      setInfoMessage('¡Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesión.');
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
      // Con la sesión iniciada, AppNavigator muestra MainTabs automáticamente
      await AuthService.login({
        email: email.trim(),
        password,
      });
    } catch (err: any) {
      setGeneralError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGeneralError('');
    const error = await google.signIn();
    if (error) setGeneralError(error);
  };

  return (
    <AuthLayout title="¡Bienvenido a PlanIt!" subtitle="Inicia sesión para continuar">
      <SocialButton
        icon={<GoogleLogo />}
        label="Continuar con Google"
        loading={google.loading}
        onPress={handleGoogleLogin}
      />

      <Divider label="o" />

      {!!infoMessage && <Banner type="success" message={infoMessage} />}
      {!!generalError && <Banner type="error" message={generalError} />}

      <InputField
        label="Correo electrónico"
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

      <InputField
        label="Contraseña"
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

      <Button variant="primary" loading={loading} onPress={handleLogin}>
        <Text style={globalStyles.primaryButtonText}>Iniciar sesión</Text>
      </Button>

      <PromptLink
        prompt="¿No tienes cuenta?"
        linkLabel="Regístrate"
        onPress={() => navigation.navigate('Register')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
