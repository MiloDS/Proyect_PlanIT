import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppStackParamList } from '../types/navigation';
import { AuthLayout } from '../components/AuthLayout';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { PromptLink } from '../components/PromptLink';
import { AuthService } from '../services/authService';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { messages } from '../utils/messages';
import {
  RESET_CODE_MAX_LENGTH,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateResetCode,
} from '../utils/validation';

type Props = NativeStackScreenProps<AppStackParamList, 'ForgotPassword'>;

// 1. correo → 2. código que llega al correo → 3. contraseña nueva
type Step = 'email' | 'code' | 'password';

type FieldErrors = Partial<Record<'email' | 'code' | 'password' | 'confirmPassword', string>>;

type BannerState = { type: 'success' | 'error'; message: string } | null;

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<BannerState>(null);
  const [loading, setLoading] = useState(false);

  // Al verificar el código queda abierta una sesión de recuperación. Si la persona sale sin
  // guardar la contraseña nueva, se cierra para que la app no entre con la cuenta a medias.
  const recoveryOpen = useRef(false);
  useEffect(
    () => () => {
      if (recoveryOpen.current) AuthService.logout().catch(() => {});
    },
    []
  );

  const clearError = (field: keyof FieldErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setBanner(null);
  };

  const run = async (task: () => Promise<void>) => {
    setLoading(true);
    setBanner(null);
    try {
      await task();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || messages.auth.resetFailed });
    } finally {
      setLoading(false);
    }
  };

  const sendCode = (isResend = false) => {
    const emailError = validateEmail(email);
    setErrors({ email: emailError });
    if (emailError || loading) return;

    run(async () => {
      await AuthService.sendPasswordResetCode(email.trim());
      setCode('');
      setStep('code');
      setBanner({
        type: 'success',
        message: isResend
          ? messages.auth.resetCodeResent
          : messages.auth.resetCodeSent(email.trim()),
      });
    });
  };

  const verifyCode = () => {
    const codeError = validateResetCode(code);
    setErrors({ code: codeError });
    if (codeError || loading) return;

    run(async () => {
      await AuthService.verifyPasswordResetCode(email.trim(), code.trim());
      recoveryOpen.current = true;
      setStep('password');
    });
  };

  const savePassword = () => {
    const passwordError = validateNewPassword(password);
    const confirmError = validatePasswordConfirmation(password, confirmPassword);
    setErrors({ password: passwordError, confirmPassword: confirmError });
    if (passwordError || confirmError || loading) return;

    // Al guardarla, AppNavigator abre la app y esta pantalla se desmonta: ya no hay que
    // cerrar la sesión. Si falla, la sesión de recuperación sigue abierta para reintentar.
    recoveryOpen.current = false;
    run(async () => {
      try {
        await AuthService.updatePassword(password);
      } catch (err) {
        recoveryOpen.current = true;
        throw err;
      }
    });
  };

  const changeEmail = () => {
    setStep('email');
    setErrors({});
    setBanner(null);
  };

  const subtitle = {
    email: 'Te enviaremos un código a tu correo',
    code: `Escribe el código que enviamos a ${email.trim()}`,
    password: 'La usarás para entrar a PlanIt',
  }[step];

  const title = {
    email: 'Recupera tu cuenta',
    code: 'Revisa tu correo',
    password: 'Crea una contraseña nueva',
  }[step];

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {!!banner && <Banner type={banner.type} message={banner.message} />}

      {step === 'email' && (
        <>
          <InputField
            label="Correo electrónico"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError('email');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={errors.email}
          />
          <Button variant="primary" loading={loading} onPress={() => sendCode()}>
            <Text style={globalStyles.primaryButtonText}>Enviar código</Text>
          </Button>
        </>
      )}

      {step === 'code' && (
        <>
          <InputField
            label="Código"
            placeholder="123456"
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/\D/g, ''));
              clearError('code');
            }}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={RESET_CODE_MAX_LENGTH}
            error={errors.code}
          />
          <Button variant="primary" loading={loading} onPress={verifyCode}>
            <Text style={globalStyles.primaryButtonText}>Verificar código</Text>
          </Button>
          <View style={styles.links}>
            <Pressable
              onPress={() => sendCode(true)}
              disabled={loading}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.link}>Reenviar código</Text>
            </Pressable>
            <Pressable onPress={changeEmail} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>Usar otro correo</Text>
            </Pressable>
          </View>
        </>
      )}

      {step === 'password' && (
        <>
          <InputField
            label="Contraseña nueva"
            placeholder="········"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError('password');
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            error={errors.password}
          />
          <InputField
            label="Confirmar contraseña"
            placeholder="········"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearError('confirmPassword');
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
          <Button variant="primary" loading={loading} onPress={savePassword}>
            <Text style={globalStyles.primaryButtonText}>Guardar contraseña</Text>
          </Button>
        </>
      )}

      <PromptLink
        prompt="¿Recordaste tu contraseña?"
        linkLabel="Inicia sesión"
        onPress={() => navigation.navigate('Login')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  link: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
