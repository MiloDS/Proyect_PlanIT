import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

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
import { globalStyles } from '../styles/globalStyles';
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
  const [loading, setLoading] = useState(false);
  const google = useGoogleSignIn();

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

    if (nextNameError || nextEmailError || nextPasswordError || nextConfirmPasswordError || loading) {
      return;
    }

    setLoading(true);
    try {
      const { needsEmailConfirmation } = await AuthService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Sin confirmación de correo, Supabase ya inició sesión y AppNavigator muestra MainTabs
      if (needsEmailConfirmation) {
        navigation.navigate('Login', { registeredEmail: email.trim() });
      }
    } catch (err: any) {
      if (err.code === 'user_already_exists') {
        setEmailError(err.message);
      } else {
        setGeneralError(err.message || 'Error al crear la cuenta');
      }
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
    <AuthLayout title="¡Crea tu cuenta!" subtitle="Regístrate para continuar">
      <SocialButton
        icon={<GoogleLogo />}
        label="Continuar con Google"
        loading={google.loading}
        onPress={handleGoogleLogin}
      />

      <Divider label="o" />

      {!!generalError && <Banner type="error" message={generalError} />}

      <InputField
        label="Nombre completo"
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

      <InputField
        label="Confirmar contraseña"
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

      <Button variant="primary" style={styles.registerButton} loading={loading} onPress={handleRegister}>
        <Text style={globalStyles.primaryButtonText}>Registrarse</Text>
      </Button>

      <PromptLink
        prompt="¿Ya tienes cuenta?"
        linkLabel="Inicia sesión"
        onPress={() => navigation.navigate('Login')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  registerButton: {
    marginTop: 8,
  },
});
