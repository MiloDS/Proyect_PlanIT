import { StyleSheet, Text, View } from 'react-native';
import { Check, Undo2, X } from 'lucide-react-native';

import { PlanSuggestionCardProps } from '../types/components';
import { PlanChangeRow } from '../types/plans';
import { Button } from './Button';
import { MemberAvatar } from './MemberAvatar';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { globalStyles } from '../styles/globalStyles';
import { formatShortDate, formatTime } from '../utils/date';

const STATUS_TEXT = {
  accepted: 'Aceptada: los cambios ya están en el plan.',
  rejected: 'Rechazada: el plan quedó como estaba.',
};

function ChangeRow({ row, styles }: { row: PlanChangeRow; styles: ReturnType<typeof makeStyles> }) {
  let value;
  if (!row.before) value = <Text style={styles.added}>+ {row.after}</Text>;
  else if (!row.after) value = <Text style={styles.removed}>− {row.before}</Text>;
  else {
    value = (
      <Text style={styles.changeValue}>
        <Text style={styles.before}>{row.before}</Text>
        {'  →  '}
        <Text style={styles.after}>{row.after}</Text>
      </Text>
    );
  }

  return (
    <View style={styles.changeRow}>
      <Text style={styles.changeLabel}>{row.label}</Text>
      {value}
    </View>
  );
}

/**
 * Una sugerencia de cambios con su "antes → después". Quien creó el plan la acepta o la
 * rechaza; quien la envió la puede retirar mientras espera respuesta.
 */
export function PlanSuggestionCard({
  suggestion,
  rows,
  isMine,
  canAnswer,
  busyAction,
  onAction,
}: PlanSuggestionCardProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isPending = suggestion.status === 'pending';
  const name = suggestion.authorName?.trim() || 'Alguien del plan';
  const createdAt = new Date(suggestion.createdAt);
  const busy = busyAction !== null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MemberAvatar name={suggestion.authorName} avatarUrl={suggestion.authorAvatarUrl} />
        <View style={styles.headerText}>
          <Text style={styles.author} numberOfLines={1}>
            {isMine ? 'Tu sugerencia' : `${name} sugiere`}
          </Text>
          <Text style={styles.date}>
            {formatShortDate(createdAt)} · {formatTime(createdAt)}
          </Text>
        </View>
      </View>

      {!!suggestion.message && <Text style={styles.message}>“{suggestion.message}”</Text>}

      {isPending ? (
        <View style={styles.changes}>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <ChangeRow key={`${row.label}-${index}`} row={row} styles={styles} />
            ))
          ) : (
            <Text style={styles.muted}>El plan ya tiene estos cambios.</Text>
          )}
        </View>
      ) : (
        <Text
          style={[
            styles.status,
            suggestion.status === 'accepted' ? styles.statusAccepted : styles.statusRejected,
          ]}
        >
          {suggestion.status === 'accepted' ? STATUS_TEXT.accepted : STATUS_TEXT.rejected}
        </Text>
      )}

      {isPending && canAnswer && (
        <View style={styles.actions}>
          <Button
            style={styles.secondaryButton}
            loading={busyAction === 'reject'}
            disabled={busy}
            onPress={() => onAction('reject')}
            accessibilityLabel={`Rechazar la sugerencia de ${name}`}
          >
            <X size={17} color={colors.textBody} />
            <Text style={styles.secondaryText}>Rechazar</Text>
          </Button>
          <Button
            variant="primary"
            style={styles.primaryButton}
            loading={busyAction === 'accept'}
            disabled={busy}
            onPress={() => onAction('accept')}
            accessibilityLabel={`Aceptar la sugerencia de ${name}`}
          >
            <Check size={17} color={colors.white} />
            <Text style={[globalStyles.primaryButtonText, styles.actionText]}>Aceptar</Text>
          </Button>
        </View>
      )}

      {isPending && isMine && (
        <View style={styles.waitingRow}>
          <Text style={[styles.muted, styles.waitingText]}>
            Esperando la respuesta de quien organiza.
          </Text>
          <Button
            style={styles.withdrawButton}
            loading={busyAction === 'withdraw'}
            disabled={busy}
            onPress={() => onAction('withdraw')}
          >
            <Undo2 size={15} color={colors.primary} />
            <Text style={styles.withdrawText}>Retirar</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      gap: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerText: {
      flex: 1,
    },
    author: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    date: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      fontStyle: 'italic',
      color: colors.textBody,
      padding: 10,
      borderRadius: 12,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    changes: {
      gap: 10,
    },
    changeRow: {
      gap: 2,
    },
    changeLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    changeValue: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    before: {
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    after: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    added: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.success,
    },
    removed: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.danger,
      textDecorationLine: 'line-through',
    },
    muted: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    status: {
      fontSize: 13,
      fontWeight: '600',
    },
    statusAccepted: {
      color: colors.success,
    },
    statusRejected: {
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    secondaryText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textBody,
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      minHeight: 44,
      paddingVertical: 10,
    },
    actionText: {
      fontSize: 15,
    },
    waitingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    waitingText: {
      flex: 1,
    },
    withdrawButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    withdrawText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
  });
}
