import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CalendarDays, CalendarPlus, CloudOff, Plus } from 'lucide-react-native';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { PlanCard } from '../components/PlanCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { useFavorites } from '../services/FavoritesContext';
import { usePlans } from '../services/usePlans';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { isUpcoming } from '../utils/date';

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
  const plans = usePlans();
  const { isFavoritePlan, togglePlan } = useFavorites();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  const now = new Date();
  const visiblePlans = plans.plans.filter(
    (plan) => isUpcoming(new Date(plan.startsAt), now) === (activeTab === 'upcoming')
  );
  // Los pasados, del más reciente al más antiguo
  if (activeTab === 'past') visiblePlans.reverse();

  const createPlan = () => navigation.navigate('CreatePlan');

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Mis planes</Text>

        <View style={styles.tabs}>
          <SegmentedControl options={TABS} value={activeTab} onChange={setActiveTab} />
        </View>

        {plans.status === 'loading' && (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        )}

        {plans.status === 'error' && (
          <EmptyState
            icon={<CloudOff size={28} color={colors.primary} />}
            title="No pudimos cargar tus planes"
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
                ? 'Crea uno con los lugares que quieres visitar.'
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
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 96,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 18,
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
