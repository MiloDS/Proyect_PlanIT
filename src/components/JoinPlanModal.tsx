import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Keyboard, ScanLine } from 'lucide-react-native';

import { JoinPlanModalProps } from '../types/components';
import { Banner } from './Banner';
import { Button } from './Button';
import { InputField } from './InputField';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { formatInviteCode, getInviteCodeFromQr } from '../utils/inviteCode';
import { messages } from '../utils/messages';
import { validateInviteCode } from '../utils/validation';

// "K7P2-QX9M": 8 caracteres y el guion
const CODE_INPUT_LENGTH = 9;
// Un QR que no es de PlanIt se ignora unos segundos para no repetir el aviso en cada cuadro
const WRONG_QR_PAUSE_MS = 2500;

// Hoja inferior para unirse a un plan con su código, escrito o escaneando el QR
export function JoinPlanModal({ visible, onClose, onJoin }: JoinPlanModalProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [scanning, setScanning] = useState(false);
  // La cámara avisa varias veces por segundo mientras ve el QR: se atiende solo el primero
  const scanLocked = useRef(false);

  const close = () => {
    setCode('');
    setFieldError('');
    setError('');
    setScanning(false);
    scanLocked.current = false;
    onClose();
  };

  const join = async (value: string) => {
    const validation = validateInviteCode(value);
    if (validation) {
      setFieldError(validation);
      return;
    }
    setJoining(true);
    setError('');
    try {
      await onJoin(value);
      setCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoining(false);
      scanLocked.current = false;
    }
  };

  const startScanning = async () => {
    setError('');
    const current = permission?.granted ? permission : await requestPermission();
    if (!current.granted) {
      setError(messages.plans.scanPermissionDenied);
      return;
    }
    scanLocked.current = false;
    setScanning(true);
  };

  const handleScan = ({ data }: { data: string }) => {
    if (scanLocked.current) return;
    scanLocked.current = true;

    const scanned = getInviteCodeFromQr(data);
    if (!scanned) {
      setError(messages.plans.qrNotPlanit);
      setTimeout(() => {
        scanLocked.current = false;
      }, WRONG_QR_PAUSE_MS);
      return;
    }
    setScanning(false);
    setCode(formatInviteCode(scanned));
    setFieldError('');
    join(scanned);
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
            Unirme a un plan
          </Text>
          <Text style={styles.description}>
            {scanning
              ? 'Apunta la cámara al QR que te muestra tu amigo en su teléfono.'
              : 'Escribe el código que te compartieron o escanea el QR del plan.'}
          </Text>

          {!!error && <Banner type="error" message={error} />}

          {scanning ? (
            <View style={styles.camera}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleScan}
              />
              <View style={styles.cameraFrame} pointerEvents="none" />
            </View>
          ) : (
            <InputField
              label="Código del plan"
              placeholder="K7P2-QX9M"
              value={code}
              onChangeText={(text) => {
                setCode(formatInviteCode(text));
                if (fieldError) setFieldError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={CODE_INPUT_LENGTH}
              error={fieldError}
            />
          )}

          {!scanning && (
            <Button
              variant="primary"
              style={styles.button}
              loading={joining}
              onPress={() => join(code)}
            >
              <Text style={globalStyles.primaryButtonText}>Unirme</Text>
            </Button>
          )}
          <Button
            style={styles.secondaryButton}
            onPress={scanning ? () => setScanning(false) : startScanning}
          >
            {scanning ? (
              <Keyboard size={18} color={colors.primary} />
            ) : (
              <ScanLine size={18} color={colors.primary} />
            )}
            <Text style={styles.secondaryText}>
              {scanning ? 'Escribir el código' : 'Escanear QR'}
            </Text>
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
  camera: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    width: 190,
    height: 190,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.white,
  },
  button: {
    borderRadius: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 4,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
