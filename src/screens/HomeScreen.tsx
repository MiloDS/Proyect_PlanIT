import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Sparkles } from 'lucide-react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { PlaceCard } from '../components/PlaceCard';
import { Button } from '../components/Button';
import { MemberAvatar } from '../components/MemberAvatar';
import { WeatherCard } from '../components/WeatherCard';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { useAuth } from '../services/AuthContext';
import { useProfile } from '../services/ProfileContext';
import { useNearbyPlaces } from '../services/useNearbyPlaces';
import { usePullToRefresh } from '../services/usePullToRefresh';
import { useWeather } from '../services/useWeather';
import { distanceKm } from '../utils/geo';
import { getDisplayAvatar, getDisplayName, getFirstName } from '../utils/user';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useProfile();
  const nearby = useNearbyPlaces();
  const locationLabel = nearby.locationLabel || 'Buscando ubicación…';
  const origin = nearby.position?.coordinates;
  const weather = useWeather(origin);
  const displayName = getDisplayName(user, profile);

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pullToRefresh.refreshing}
            onRefresh={pullToRefresh.onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressViewOffset={insets.top}
          />
        }
      >
        <View
          style={styles.locationRow}
          accessible
          accessibilityLabel={`Ubicación: ${locationLabel}`}
        >
          <MapPin size={16} color={colors.textPrimary} />
          <Text style={styles.locationText}>{locationLabel}</Text>
        </View>

        <Text style={styles.greeting}>¡Hola, {getFirstName(displayName)}! 👋</Text>
        <Text style={styles.subGreeting}>¿Qué plan tienes hoy?</Text>

        <WeatherCard status={weather.status} weather={weather.weather} onRetry={weather.retry} />

        <View style={styles.surpriseCard}>
          <View style={styles.surpriseHeader}>
            <MemberAvatar
              name={displayName}
              avatarUrl={getDisplayAvatar(user, profile) ?? null}
              size={42}
              style={styles.surpriseAvatar}
            />
            <View style={styles.surpriseText}>
              <Text style={styles.surpriseTitle}>Sorpréndeme</Text>
              <Text style={styles.surpriseDescription}>
                Dinos qué te gusta y te mostraremos opciones increíbles.
              </Text>
            </View>
          </View>

          <Button
            variant="primary"
            style={styles.surpriseButton}
            onPress={() => navigation.navigate('SurpriseMe')}
          >
            <Text style={styles.surpriseButtonText}>Sorpréndeme</Text>
            <Sparkles size={16} color={colors.white} />
          </Button>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cerca de ti</Text>
          <Pressable
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.sectionLink}>Ver todo</Text>
          </Pressable>
        </View>

        {nearby.status === 'loading' && (
          <ActivityIndicator color={colors.primary} style={styles.placesStatus} />
        )}

        {nearby.status === 'error' && (
          <View style={styles.placesStatus}>
            <Text style={styles.placesMessage}>{nearby.error}</Text>
            <Pressable onPress={nearby.reload} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.sectionLink}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {nearby.status === 'ready' && nearby.places.length === 0 && (
          <Text style={[styles.placesMessage, styles.placesStatus]}>
            No encontramos lugares cerca de ti.
          </Text>
        )}

        {nearby.status === 'ready' && origin && nearby.places.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.placesRow}
            >
              {nearby.places.map((place) => (
                <PlaceCard
                  key={place.id}
                  name={place.name}
                  category={place.category}
                  imageUrl={place.photoUrl}
                  distanceKm={distanceKm(origin, place.location)}
                  onPress={() => navigation.navigate('PlaceDetail', { place })}
                />
              ))}
            </ScrollView>
            <Text style={styles.attribution}>
              {nearby.position?.isApproximate
                ? 'Ubicación aproximada. Datos de Google Maps'
                : 'Datos de Google Maps'}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 20,
  },
  surpriseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  surpriseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  surpriseAvatar: {
    marginRight: 12,
  },
  surpriseText: {
    flex: 1,
  },
  surpriseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  surpriseDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  surpriseButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    minHeight: 44,
  },
  surpriseButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  placesRow: {
    paddingRight: 24,
  },
  placesStatus: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  placesMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  attribution: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
  },
});
