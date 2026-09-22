import {StyleSheet, View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {useState} from 'react'

import { AppStackParamList } from '../types/navigation';
import { InputField } from '../components/InputField'
import { SocialButton } from '../components/SocialButton';
import { Button } from '../components/Button';
import { saveUserSession } from '../utils/storage';
import { colors } from '../styles/colors';
import { isValidEmail, isEmpty } from '../utils/validation';

type Props = NativeStackScreenProps<AppStackParamList, "Login">;

export function LoginScreen ({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleLogin = async () => {
      const nextEmailError = isEmpty(email)
        ? 'El correo es obligatorio'
        : !isValidEmail(email)
        ? 'Ingresa un correo válido (ejemplo@dominio.com)'
        : '';

      const nextPasswordError = isEmpty(password) ? 'La contraseña es obligatoria' : '';

      setEmailError(nextEmailError);
      setPasswordError(nextPasswordError);

      if (nextEmailError || nextPasswordError) {
        return;
      }

      await saveUserSession(email);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    };

    return (
        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined} >
            <ScrollView style={{marginTop: 120, marginHorizontal: 25}}>
                <Text style={styles.title}>¡Bienvenido a PlanIt!</Text>
                <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                <SocialButton
                    iconName='logo-google'
                    iconColor='#4285F4'
                    label="Continuar con Google"
                    onPress={() => {}}
                />

                <SocialButton
                    iconName='logo-apple'
                    iconColor='#000'
                    label="Continuar con Apple"
                    onPress={() => {}}
                />

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>o</Text>
                    <View style={styles.dividerLine} />
                </View>

                <Text style={styles.label}>Correo electrónico</Text>
                  <InputField
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChangeText={(text) => { setEmail(text); setEmailError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={emailError}
                    />

                <Text style={styles.label}>Contraseña</Text>
                <View>
                    <InputField
                      placeholder="········"
                      value={password}
                      onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={passwordError}
                      />
                </View>

                <Pressable style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                <Button style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Iniciar sesión</Text>
                </Button>

                <Text style={styles.registerPrompt}>
                    ¿No tienes cuenta?{' '}
                    <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
                        Regístrate
                    </Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
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
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerPrompt: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
    color: '#666',
  },
  registerLink: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});