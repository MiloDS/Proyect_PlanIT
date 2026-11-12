import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  AppState,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BellOff, BellRing } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { Banner } from '../components/Banner';
import { ScreenHeader } from '../components/ScreenHeader';
import { PlanReminders, REMINDER_OPTIONS, ReminderPermission } from '../services/planReminders';
import { PlansService } from '../services/plansService';
import { globalStyles } from '../styles/globalStyles';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { ReminderSettings, getReminderSettings, saveReminderSettings } from '../utils/storage';
import { messages } from '../utils/messages';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [askedPermission, setAskedPermission] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getReminderSettings(), PlanReminders.getPermission()]).then(
      ([savedSettings, currentPermission]) => {
        if (cancelled) return;
        setSettings(savedSettings);
        setPermission(currentPermission);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Al volver de los ajustes del teléfono se revisa otra vez el permiso
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') PlanReminders.getPermission().then(setPermission);
    });
    return () => subscription.remove();
  }, []);

  if (!settings || !permission) {
    return (
      <View style={[globalStyles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Notificaciones" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      </View>
    );
  }

  const isEnabled = settings.enabled && permission === 'granted';
  const isBlocked =
    permission === 'blocked' || (permission === 'denied' && (settings.enabled || askedPermission));

  const apply = async (next: ReminderSettings) => {
    setUpdating(true);
    setError('');
    try {
      await saveReminderSettings(next);
      setSettings(next);
      if (next.enabled) await PlanReminders.sync(await PlansService.list());
      else await PlanReminders.cancelAll();
    } catch {
      setError(messages.reminders.syncFailed);
    } finally {
      setUpdating(false);
    }
  };

  const toggle = async (enabled: boolean) => {
    if (enabled) {
      setUpdating(true);
      const result = await PlanReminders.requestPermission().catch(
        (): ReminderPermission => 'denied'
      );
      setPermission(result);
      setAskedPermission(true);
      setUpdating(false);
      if (result !== 'granted') return;
    }
    await apply({ ...settings, enabled });
  };

  return (
    <View style={[globalStyles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader
        title="Notificaciones"
        subtitle="Recordatorios de tus planes"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            {isEnabled ? (
              <BellRing size={20} color={colors.primary} />
            ) : (
              <BellOff size={20} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Recordatorios de planes</Text>
            <Text style={styles.cardDescription}>
              Te avisamos antes de que empiece cada plan, aunque la app esté cerrada.
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={toggle}
            disabled={updating}
            trackColor={{ false: colors.inactive, true: colors.primary }}
            thumbColor={colors.white}
            accessibilityLabel="Recordatorios de planes"
          />
        </View>

        {isBlocked && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>{messages.reminders.permissionBlocked}</Text>
            <Pressable
              onPress={() => Linking.openSettings()}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.link}>Abrir ajustes</Text>
            </Pressable>
          </View>
        )}

        {!!error && <Banner type="error" message={error} />}

        {isEnabled && (
          <>
            <Text style={styles.sectionTitle}>¿Cuándo te avisamos?</Text>
            <View style={styles.options} accessibilityRole="radiogroup">
              {REMINDER_OPTIONS.map((option) => {
                const selected = option.minutesBefore === settings.minutesBefore;
                return (
                  <Pressable
                    key={option.minutesBefore}
                    onPress={() => apply({ ...settings, minutesBefore: option.minutesBefore })}
                    disabled={updating || selected}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: updating }}
                    style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                  >
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.footnote}>
          Los recordatorios se guardan en este teléfono. Si alguien cambia un plan, el aviso se
          actualiza la próxima vez que abras PlanIt.
        </Text>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  loading: {
    marginTop: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 2,
  },
  warning: {
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 10,
  },
  options: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  optionLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 20,
  },
});
}
