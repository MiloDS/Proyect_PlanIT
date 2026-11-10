import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, ChevronDown, Bell, Cloud, Sparkles } from 'lucide-react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { PlaceCard } from '../components/PlaceCard';
import { Button } from '../components/Button';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { useAuth } from '../services/AuthContext';
import { PlacesService } from '../services/placesService';
import { useNearbyPlaces } from '../services/useNearbyPlaces';
import { distanceKm } from '../utils/geo';
import { getFirstName } from '../utils/user';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const nearby = useNearbyPlaces();
  const locationLabel = nearby.locationLabel || 'Buscando ubicación…';
  const origin = nearby.position?.coordinates;

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.locationRow}
            accessibilityRole="button"
            accessibilityLabel={`Ubicación: ${locationLabel}`}
          >
            <MapPin size={16} color={colors.textPrimary} />
            <Text style={styles.locationText}>{locationLabel}</Text>
            <ChevronDown size={16} color={colors.textPrimary} />
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel="Notificaciones" hitSlop={8}>
            <Bell size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.greeting}>¡Hola, {getFirstName(user)}! 👋</Text>
        <Text style={styles.subGreeting}>¿Qué plan tienes hoy?</Text>

        <View style={styles.weatherCard}>
          <View>
            <Text style={styles.weatherTemp}>24°C</Text>
            <Text style={styles.weatherDescription}>Parcialmente nublado</Text>
            <Text style={styles.weatherMinMax}>Máx. 27° Mín. 18°</Text>
          </View>
          <Cloud size={40} color={colors.white} />
        </View>

        <View style={styles.surpriseCard}>
          <View style={styles.surpriseHeader}>
            <Image
              source={{ uri: 'https://i.imgur.com/abrpNLZ.jpeg' }}
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
          <Pressable>
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
                  onPress={() => PlacesService.openInMaps(place)}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  weatherCard: {
    backgroundColor: colors.weather,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherTemp: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  weatherDescription: {
    fontSize: 13,
    color: colors.white,
    marginTop: 2,
  },
  weatherMinMax: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
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
    width: 42,
    height: 42,
    borderRadius: 21,
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
