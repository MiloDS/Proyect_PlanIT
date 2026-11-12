import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CalendarHeart, CloudOff, Heart } from 'lucide-react-native';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { EmptyState } from '../components/EmptyState';
import { FavoriteButton } from '../components/FavoriteButton';
import { PlaceListItem } from '../components/PlaceListItem';
import { PlanCard } from '../components/PlanCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { useFavorites } from '../services/FavoritesContext';
import { useDevicePosition } from '../services/useDevicePosition';
import { usePlacesById } from '../services/usePlacesById';
import { usePlans } from '../services/usePlans';
import { usePullToRefresh } from '../services/usePullToRefresh';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { distanceKm } from '../utils/geo';
import { messages } from '../utils/messages';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Favorites'>,
  NativeStackScreenProps<AppStackParamList>
>;

type Tab = 'all' | 'places' | 'plans';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'places', label: 'Lugares' },
  { value: 'plans', label: 'Planes' },
];

function SectionTitle({ children, color }: { children: string; color: string }) {
  const { colors: themeColors } = useTheme();
  const styles = makeStyles(themeColors);
  return <Text style={[styles.sectionTitle, { color }]}>{children}</Text>;
}

export function FavoritesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const styles = makeStyles(themeColors);
  const position = useDevicePosition();
  const favorites = useFavorites();
  const plans = usePlans();
  const favoritePlaces = usePlacesById(favorites.places.map((entry) => entry.id));
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const pullToRefresh = usePullToRefresh(() => {
    // Los datos de Google de los lugares ya cargados casi no cambian: solo se vuelven a
    // pedir si habían fallado
    if (favoritePlaces.error) favoritePlaces.retry();
    return Promise.all([favorites.refresh(), plans.refresh()]);
  });

  const favoritePlans = favorites.plans.flatMap((entry) => {
    const plan = plans.plans.find((item) => item.id === entry.id);
    return plan ? [plan] : [];
  });

  const showPlaces = activeTab !== 'plans';
  const showPlans = activeTab !== 'places';
  const placesLoading = favoritePlaces.loading && favoritePlaces.places.length === 0;
  const plansLoading = plans.status === 'loading' && favorites.plans.length > 0;
  const nothingSaved = favorites.places.length === 0 && favorites.plans.length === 0;

  const renderPlaces = () => {
    if (placesLoading) return <ActivityIndicator color={colors.primary} style={styles.loading} />;
    if (favoritePlaces.error) {
      return (
        <EmptyState
          icon={<CloudOff size={28} color={colors.primary} />}
          title={messages.favorites.placesLoadFailedTitle}
          message={favoritePlaces.error}
          actionLabel="Reintentar"
          onAction={favoritePlaces.retry}
        />
      );
    }
    if (favorites.places.length === 0) {
      return activeTab === 'places' ? (
        <EmptyState
          icon={<Heart size={28} color={colors.primary} />}
          title="Aún no tienes lugares favoritos"
          message="Toca el corazón en un lugar para guardarlo aquí."
          actionLabel="Explorar lugares"
          onAction={() => navigation.navigate('Search')}
        />
      ) : null;
    }
    return (
      <View style={styles.list}>
        {favoritePlaces.places.map((place) => (
          <PlaceListItem
            key={place.id}
            place={place}
            distanceKm={position ? distanceKm(position.coordinates, place.location) : null}
            onPress={() => navigation.navigate('PlaceDetail', { place })}
            action={
              <FavoriteButton
                size={18}
                isFavorite
                itemName={place.name}
                onPress={() => favorites.togglePlace(place.id)}
              />
            }
          />
        ))}
      </View>
    );
  };

  const renderPlans = () => {
    if (plansLoading) return <ActivityIndicator color={colors.primary} style={styles.loading} />;
    if (plans.status === 'error' && favorites.plans.length > 0) {
      return (
        <EmptyState
          icon={<CloudOff size={28} color={colors.primary} />}
          title={messages.favorites.plansLoadFailedTitle}
          message={plans.error}
          actionLabel="Reintentar"
          onAction={plans.retry}
        />
      );
    }
    if (favoritePlans.length === 0) {
      return activeTab === 'plans' ? (
        <EmptyState
          icon={<CalendarHeart size={28} color={colors.primary} />}
          title="Aún no tienes planes favoritos"
          message="Toca el corazón en uno de tus planes para tenerlo a la mano."
          actionLabel="Ver mis planes"
          onAction={() => navigation.navigate('Plans')}
        />
      ) : null;
    }
    return (
      <View style={styles.list}>
        {favoritePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            coverUrl={plans.getCoverUrl(plan)}
            isFavorite
            onToggleFavorite={() => favorites.togglePlan(plan.id)}
            onPress={() => navigation.navigate('PlanDetail', { plan })}
          />
        ))}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Favoritos</Text>

        <View style={styles.tabs}>
          <SegmentedControl options={TABS} value={activeTab} onChange={setActiveTab} />
        </View>

        {favorites.status === 'loading' && (
          <ActivityIndicator color={themeColors.primary} style={styles.loading} />
        )}

        {favorites.status === 'error' && (
          <EmptyState
            icon={<CloudOff size={28} color={themeColors.primary} />}
            title={messages.favorites.loadFailedTitle}
            message={favorites.error}
            actionLabel="Reintentar"
            onAction={favorites.reload}
          />
        )}

        {favorites.status === 'ready' && activeTab === 'all' && nothingSaved && (
          <EmptyState
            icon={<Heart size={28} color={themeColors.primary} />}
            title="Aún no tienes favoritos"
            message="Guarda lugares y planes tocando el corazón para encontrarlos aquí."
            actionLabel="Explorar lugares"
            onAction={() => navigation.navigate('Search')}
          />
        )}

        {favorites.status === 'ready' && !(activeTab === 'all' && nothingSaved) && (
          <>
            {showPlaces && (
              <>
                {activeTab === 'all' && favorites.places.length > 0 && (
                  <SectionTitle color={themeColors.textPrimary}>Lugares</SectionTitle>
                )}
                {renderPlaces()}
              </>
            )}
            {showPlans && (
              <>
                {activeTab === 'all' && favorites.plans.length > 0 && (
                  <SectionTitle color={themeColors.textPrimary}>Planes</SectionTitle>
                )}
                {renderPlans()}
              </>
            )}
            {showPlaces && favoritePlaces.places.length > 0 && (
              <Text style={styles.attribution}>Datos de Google Maps</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
    marginVertical: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  },
  list: {
    gap: 12,
    marginBottom: 18,
  },
  attribution: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
}
