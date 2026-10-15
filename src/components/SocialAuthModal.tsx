import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { isValidEmail } from '../utils/validation';

interface SocialAuthModalProps {
  visible: boolean;
  provider: 'google' | 'apple' | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (email: string, name?: string) => Promise<void>;
}

export function SocialAuthModal({
  visible,
  provider,
  loading,
  onClose,
  onSubmit,
}: SocialAuthModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setEmail('');
      setName('');
      setError('');
    }
  }, [visible]);

  if (!provider) return null;

  const isGoogle = provider === 'google';

  const handleConfirm = async () => {
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        isGoogle
          ? 'Ingresa tu cuenta de Gmail'
          : 'Ingresa tu Apple ID o correo de Apple'
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Ingresa un formato de correo válido (ej: usuario@dominio.com)');
      return;
    }

    if (isGoogle && !cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@googlemail.com')) {
      setError('Debes ingresar una cuenta de Gmail válida (@gmail.com)');
      return;
    }

    try {
      await onSubmit(cleanEmail, name.trim() || undefined);
    } catch (err: any) {
      setError(err.message || 'Error al autenticar');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={styles.card}>
              {/* Header con icono y título */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: isGoogle ? '#E8F0FE' : '#F3F4F6' },
                  ]}
                >
                  <Ionicons
                    name={isGoogle ? 'logo-google' : 'logo-apple'}
                    size={28}
                    color={isGoogle ? '#4285F4' : '#000000'}
                  />
                </View>
                <Text style={styles.title}>
                  {isGoogle ? 'Continuar con Google' : 'Continuar con Apple'}
                </Text>
                <Text style={styles.subtitle}>
                  {isGoogle
                    ? 'Ingresa tu correo de Gmail real para autenticarte con tu cuenta de Google.'
                    : 'Ingresa tu Apple ID o correo real asociado a tu cuenta de Apple.'}
                </Text>
              </View>

              {/* Mensaje de error si existe */}
              {!!error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Input de Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {isGoogle ? 'Correo de Gmail *' : 'Correo o Apple ID *'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    isGoogle ? 'tu_usuario@gmail.com' : 'tu_usuario@icloud.com'
                  }
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (error) setError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Input opcional de Nombre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre completo (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Juan Pérez"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              {/* Botones de acción */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleConfirm}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continuar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  buttonGroup: {
    marginTop: 8,
    gap: 8,
  },
  primaryButton: {
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
