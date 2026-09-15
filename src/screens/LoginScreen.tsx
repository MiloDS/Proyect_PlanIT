import {StyleSheet, View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {useState} from 'react'

import { AppStackParamList } from '../types/navigation';
import { InputField } from '../components/InputField'
import { SocialButton } from '../components/SocialButton';

type Props = NativeStackScreenProps<AppStackParamList, "Login">;

export function LoginScreen ({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleLogin = () => {
        if (email.trim() === '' || password.trim() === ''){
            return Alert.alert('Campos obligatorios');
        }
        navigation.navigate('Home')
    }

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
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    />

                <Text style={styles.label}>Contraseña</Text>
                <View>
                    <InputField
                      placeholder="········"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      />
                </View>

                <Pressable style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                <Pressable style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Iniciar sesión</Text>
                </Pressable>

                <Text style={styles.registerPrompt}>
                    ¿No tienes cuenta?{' '}
                    <Text style={styles.registerLink} onPress={() => navigation.navigate('Home')}>
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
    backgroundColor: '#fff',
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
    color: '#2ecc71',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
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
    color: '#2ecc71',
    fontWeight: 'bold',
  },
});