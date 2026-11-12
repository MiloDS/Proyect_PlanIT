import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CalendarDays, CalendarPlus, CloudOff, Plus, ScanLine } from 'lucide-react-native';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { JoinPlanModal } from '../components/JoinPlanModal';
import { PlanCard } from '../components/PlanCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { useFavorites } from '../services/FavoritesContext';
import { PlansService } from '../services/plansService';
import { usePlans } from '../services/usePlans';
import { usePullToRefresh } from '../services/usePullToRefresh';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { isUpcoming } from '../utils/date';
import { messages } from '../utils/messages';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Plans'>,
  NativeStackScreenProps<AppStackParamList>
>;

type Tab = 'upcoming' | 'past';

const TABS: { value: Tab; label: string }[] = [
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
];

export function PlansScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const styles = makeStyles(themeColors);
  const plans = usePlans();
  const { isFavoritePlan, togglePlan } = useFavorites();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const pullToRefresh = usePullToRefresh(plans.refresh);
  const [joinOpen, setJoinOpen] = useState(false);

  // Con el código (escrito o del QR) entra al plan y lo abre
  const joinPlan = async (code: string) => {
    const { planId, alreadyMember } = await PlansService.joinByCode(code);
    const plan = await PlansService.get(planId);
    if (!plan) throw new Error(messages.plans.joinFailed);
    setJoinOpen(false);
    navigation.navigate('PlanDetail', { plan });
    Alert.alert(
      alreadyMember ? messages.plans.alreadyJoinedTitle : messages.plans.joinedTitle,
      alreadyMember ? messages.plans.alreadyJoined(plan.title) : messages.plans.joined(plan.title)
    );
  };

  const now = new Date();
  const visiblePlans = plans.plans.filter(
    (plan) => isUpcoming(new Date(plan.startsAt), now) === (activeTab === 'upcoming')
  );
  // Los pasados, del más reciente al más antiguo
  if (activeTab === 'past') visiblePlans.reverse();

  const createPlan = () => navigation.navigate('CreatePlan');

  return (
    <View style={[globalStyles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pullToRefresh.refreshing}
            onRefresh={pullToRefresh.onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis planes</Text>
          <Pressable
            onPress={() => setJoinOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Unirme a un plan con un código"
            hitSlop={8}
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
          >
            <ScanLine size={17} color={themeColors.primary} />
            <Text style={styles.joinText}>Unirme</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <SegmentedControl options={TABS} value={activeTab} onChange={setActiveTab} />
        </View>

        {plans.status === 'loading' && (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        )}

        {plans.status === 'error' && (
          <EmptyState
            icon={<CloudOff size={28} color={colors.primary} />}
            title={messages.plans.loadListFailedTitle}
            message={plans.error}
            actionLabel="Reintentar"
            onAction={plans.retry}
          />
        )}

        {plans.status === 'ready' && visiblePlans.length === 0 && (
          <EmptyState
            icon={
              activeTab === 'upcoming' ? (
                <CalendarPlus size={28} color={colors.primary} />
              ) : (
                <CalendarDays size={28} color={colors.primary} />
              )
            }
            title={
              activeTab === 'upcoming'
                ? 'No tienes planes próximos'
                : 'Todavía no tienes planes pasados'
            }
            message={
              activeTab === 'upcoming'
                ? 'Crea uno con los lugares que quieres visitar, o únete con el código que te compartieron.'
                : 'Aquí verás los planes cuando ya hayan pasado.'
            }
            actionLabel={activeTab === 'upcoming' ? 'Crear plan' : undefined}
            onAction={createPlan}
          />
        )}

        {plans.status === 'ready' && visiblePlans.length > 0 && (
          <View style={styles.cardsList}>
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                coverUrl={plans.getCoverUrl(plan)}
                isFavorite={isFavoritePlan(plan.id)}
                onToggleFavorite={() => togglePlan(plan.id)}
                onPress={() => navigation.navigate('PlanDetail', { plan })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabContainer}>
        <Button variant="primary" style={styles.fabButton} onPress={createPlan}>
          <Plus size={18} color={colors.white} strokeWidth={2.5} style={styles.fabIcon} />
          <Text style={styles.fabText}>Nuevo plan</Text>
        </Button>
      </View>

      <JoinPlanModal visible={joinOpen} onClose={() => setJoinOpen(false)} onJoin={joinPlan} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 96,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    joinButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: colors.primaryLight,
    },
    joinText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryDark,
    },
    pressed: {
      opacity: 0.7,
    },
    tabs: {
      marginBottom: 20,
    },
    loading: {
      marginTop: 40,
    },
    cardsList: {
      gap: 16,
    },
    fabContainer: {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: 16,
    },
    fabButton: {
      flexDirection: 'row',
      borderRadius: 24,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 5,
    },
    fabIcon: {
      marginRight: 6,
    },
    fabText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
