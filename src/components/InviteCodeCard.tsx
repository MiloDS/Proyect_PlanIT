import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LucideIcon, QrCode as QrCodeIcon, RefreshCw, Share2 } from 'lucide-react-native';

import { InviteCodeCardProps } from '../types/components';
import { Button } from './Button';
import { QrCode } from './QrCode';
import { colors } from '../styles/colors';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { formatInviteCode, getInviteQrValue } from '../utils/inviteCode';
import { messages } from '../utils/messages';

const QR_SIZE = 232;

function CardAction({
  Icon,
  label,
  onPress,
  busy = false,
  styles,
  primaryColor,
}: {
  Icon: LucideIcon;
  label: string;
  onPress: () => void;
  busy?: boolean;
  styles: ReturnType<typeof makeStyles>;
  primaryColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={primaryColor} />
      ) : (
        <Icon size={17} color={primaryColor} />
      )}
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

/**
 * Código del plan para que otras personas se unan escribiéndolo o escaneando su QR.
 * Cualquiera del plan lo puede compartir; solo el dueño lo cambia.
 */
export function InviteCodeCard({ code, planTitle, onRegenerate }: InviteCodeCardProps) {
  const { colors: themeColors } = useTheme();
  const styles = makeStyles(themeColors);
  const [qrOpen, setQrOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const formatted = formatInviteCode(code);

  const share = () => {
    Share.share({ message: messages.plans.shareCode(planTitle, formatted) });
  };

  const confirmRegenerate = () => {
    if (!onRegenerate) return;
    Alert.alert(messages.plans.regenerateCodeTitle, messages.plans.regenerateCodeConfirm, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cambiar',
        style: 'destructive',
        onPress: async () => {
          setRegenerating(true);
          try {
            await onRegenerate();
          } catch (err: any) {
            Alert.alert(messages.plans.regenerateCodeTitle, err.message);
          } finally {
            setRegenerating(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Código para unirse</Text>
      <Text style={styles.code} accessibilityLabel={`Código: ${[...code].join(' ')}`} selectable>
        {formatted}
      </Text>
      <Text style={styles.hint}>
        Quien lo tenga puede unirse desde Planes → Unirme. Cualquiera del plan puede compartirlo.
      </Text>

      <View style={styles.actions}>
        <CardAction
          Icon={Share2}
          label="Compartir"
          onPress={share}
          styles={styles}
          primaryColor={themeColors.primary}
        />
        <CardAction
          Icon={QrCodeIcon}
          label="Ver QR"
          onPress={() => setQrOpen(true)}
          styles={styles}
          primaryColor={themeColors.primary}
        />
        {!!onRegenerate && (
          <CardAction
            Icon={RefreshCw}
            label="Cambiar"
            onPress={confirmRegenerate}
            busy={regenerating}
            styles={styles}
            primaryColor={themeColors.primary}
          />
        )}
      </View>

      <Modal
        visible={qrOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQrOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setQrOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          {/* Tocar el QR no cierra la ventana */}
          <Pressable style={styles.qrCard} onPress={() => {}}>
            <Text style={styles.qrTitle} numberOfLines={2}>
              {planTitle}
            </Text>
            <View style={styles.qrFrame}>
              <QrCode
                value={getInviteQrValue(code)}
                size={QR_SIZE}
                accessibilityLabel={`Código QR del plan ${planTitle}`}
              />
            </View>
            <Text style={styles.qrCode}>{formatted}</Text>
            <Text style={styles.qrHint}>
              Pídele a tu amigo que lo escanee en PlanIt: Planes → Unirme → Escanear QR.
            </Text>
            <Button style={styles.closeButton} onPress={() => setQrOpen(false)}>
              <Text style={styles.closeText}>Listo</Text>
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginTop: 14,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryDark,
    },
    code: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 3,
      color: colors.textPrimary,
      marginTop: 4,
    },
    hint: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textBody,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: colors.card,
    },
    actionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    pressed: {
      opacity: 0.7,
    },
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.overlay,
    },
    qrCard: {
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      padding: 24,
      borderRadius: 24,
      backgroundColor: colors.card,
    },
    qrTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    qrFrame: {
      marginTop: 16,
      padding: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.white,
    },
    qrCode: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 3,
      color: colors.textPrimary,
      marginTop: 14,
    },
    qrHint: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },
    closeButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      marginTop: 8,
      alignSelf: 'stretch',
    },
    closeText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
    },
  });
}
