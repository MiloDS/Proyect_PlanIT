import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CalendarHeart, CloudOff, Heart } from 'lucide-react-native';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { Place } from '../types/places';
import { EmptyState } from '../components/EmptyState';
import { FavoriteButton } from '../components/FavoriteButton';
import { PlaceListItem } from '../components/PlaceListItem';
import { PlanCard } from '../components/PlanCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { useFavorites } from '../services/FavoritesContext';
import { PlacesService } from '../services/placesService';
import { useDevicePosition } from '../services/useDevicePosition';
import { usePlans } from '../services/usePlans';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { distanceKm } from '../utils/geo';

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

type PlaceLookup = {
  /** IDs (separados por coma) de la última consulta terminada */
  key: string;
  places: Record<string, Place>;
  error: string;
};

/**
 * Datos de Google de los lugares favoritos (la base de datos solo guarda el place_id).
 * Al guardar o quitar un favorito se consultan solo los que falten.
 */
function useFavoritePlaces(placeIds: string[]) {
  const idsKey = placeIds.join(',');
  const [lookup, setLookup] = useState<PlaceLookup>({ key: '', places: {}, error: '' });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;

    PlacesService.lookup(idsKey.split(','))
      .then((places) => {
        if (cancelled) return;
        setLookup((current) => ({
          key: idsKey,
          places: { ...current.places, ...Object.fromEntries(places.map((p) => [p.id, p])) },
          error: '',
        }));
      })
      .catch((err: Error) => {
        if (!cancelled) setLookup((current) => ({ ...current, key: idsKey, error: err.message }));
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey, retryKey]);

  const isCurrent = lookup.key === idsKey;
  return {
    places: placeIds.flatMap((id) => (lookup.places[id] ? [lookup.places[id]] : [])),
    loading: !!idsKey && !isCurrent,
    error: isCurrent ? lookup.error : '',
    retry: () => {
      setLookup((current) => ({ ...current, key: '', error: '' }));
      setRetryKey((key) => key + 1);
    },
  };
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function FavoritesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const position = useDevicePosition();
  const favorites = useFavorites();
  const plans = usePlans();
  const favoritePlaces = useFavoritePlaces(favorites.places.map((entry) => entry.id));
  const [activeTab, setActiveTab] = useState<Tab>('all');

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
          title="No pudimos cargar tus lugares"
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
          title="No pudimos cargar tus planes"
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
          />
        ))}
      </View>
    );
  };

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Favoritos</Text>

        <View style={styles.tabs}>
          <SegmentedControl options={TABS} value={activeTab} onChange={setActiveTab} />
        </View>

        {favorites.status === 'loading' && (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        )}

        {favorites.status === 'error' && (
          <EmptyState
            icon={<CloudOff size={28} color={colors.primary} />}
            title="No pudimos cargar tus favoritos"
            message={favorites.error}
            actionLabel="Reintentar"
            onAction={favorites.reload}
          />
        )}

        {favorites.status === 'ready' && activeTab === 'all' && nothingSaved && (
          <EmptyState
            icon={<Heart size={28} color={colors.primary} />}
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
                  <SectionTitle>Lugares</SectionTitle>
                )}
                {renderPlaces()}
              </>
            )}
            {showPlans && (
              <>
                {activeTab === 'all' && favorites.plans.length > 0 && (
                  <SectionTitle>Planes</SectionTitle>
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

const styles = StyleSheet.create({
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
