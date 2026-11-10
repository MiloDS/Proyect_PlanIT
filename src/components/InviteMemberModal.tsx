import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InviteMemberModalProps } from '../types/components';
import { Banner } from './Banner';
import { Button } from './Button';
import { InputField } from './InputField';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { validateEmail } from '../utils/validation';

// Hoja inferior para agregar personas a un plan con el correo de su cuenta
export function InviteMemberModal({ visible, onClose, onInvite }: InviteMemberModalProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [result, setResult] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [sending, setSending] = useState(false);

  const close = () => {
    setEmail('');
    setFieldError('');
    setResult(null);
    onClose();
  };

  const invite = async () => {
    const error = validateEmail(email);
    if (error) {
      setFieldError(error);
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const message = await onInvite(email.trim());
      setResult({ type: 'success', message });
      setEmail('');
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">
            Invitar al plan
          </Text>
          <Text style={styles.description}>
            Escribe el correo con el que la persona entra a PlanIt. Verá el plan en Mis planes.
          </Text>

          {!!result && <Banner type={result.type} message={result.message} />}

          <InputField
            label="Correo"
            placeholder="nombre@correo.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (fieldError) setFieldError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={fieldError}
          />

          <Button variant="primary" style={styles.button} loading={sending} onPress={invite}>
            <Text style={globalStyles.primaryButtonText}>Invitar</Text>
          </Button>
          <Button style={styles.secondaryButton} onPress={close}>
            <Text style={styles.secondaryText}>Listo</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  button: {
    borderRadius: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 4,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
