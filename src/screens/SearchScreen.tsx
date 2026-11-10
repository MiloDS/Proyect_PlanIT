import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Region } from 'react-native-maps';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LocateFixed, MapPin, RefreshCw, Search, Star, X } from 'lucide-react-native';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { Coordinates, DevicePosition, Place } from '../types/places';
import { Chip } from '../components/Chip';
import { FavoriteButton } from '../components/FavoriteButton';
import { PlaceMarker } from '../components/PlaceMarker';
import { useFavorites } from '../services/FavoritesContext';
import { LocationService } from '../services/locationService';
import { NEARBY_RADIUS_METERS, PlacesService, SEARCH_CATEGORIES } from '../services/placesService';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { distanceKm } from '../utils/geo';
import { getPlaceCategoryStyle } from '../utils/placeCategories';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Search'>,
  NativeStackScreenProps<AppStackParamList>
>;

type SearchRequest = {
  center: Coordinates;
  radiusMeters: number;
  categoryIndex: number;
  query: string;
};

type SearchResults = {
  status: 'loading' | 'ready' | 'error';
  places: Place[];
  error: string;
};

// Unos 6 km de alto: cubre el radio de búsqueda de "Cerca de ti"
const INITIAL_DELTA = 0.06;
const KM_PER_LATITUDE_DEGREE = 111;
const MIN_RADIUS_METERS = 1000;
const MAX_RADIUS_METERS = 50000;
const FIT_EDGE_PADDING = { top: 80, right: 60, bottom: 80, left: 60 };

function toRegion({ latitude, longitude }: Coordinates, delta = INITIAL_DELTA): Region {
  return { latitude, longitude, latitudeDelta: delta, longitudeDelta: delta };
}

// Radio que cubre lo que se ve del mapa (mitad del alto visible)
function radiusForRegion(region: Region): number {
  const meters = (region.latitudeDelta * KM_PER_LATITUDE_DEGREE * 1000) / 2;
  return Math.min(Math.max(Math.round(meters), MIN_RADIUS_METERS), MAX_RADIUS_METERS);
}

export function SearchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { isFavoritePlace, togglePlace } = useFavorites();

  const [position, setPosition] = useState<DevicePosition | null>(null);
  const [query, setQuery] = useState('');
  const [request, setRequest] = useState<SearchRequest | null>(null);
  const [results, setResults] = useState<SearchResults>({
    status: 'loading',
    places: [],
    error: '',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleRegion, setVisibleRegion] = useState<Region | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Primera búsqueda: lugares populares alrededor del usuario
  useEffect(() => {
    let cancelled = false;
    LocationService.getCurrentPosition().then((current) => {
      if (cancelled) return;
      setPosition(current);
      setRequest({
        center: current.coordinates,
        radiusMeters: NEARBY_RADIUS_METERS,
        categoryIndex: 0,
        query: '',
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!request) return;
    let cancelled = false;

    PlacesService.search(
      request.center,
      SEARCH_CATEGORIES[request.categoryIndex],
      request.query,
      request.radiusMeters
    )
      .then((places) => {
        if (cancelled) return;
        setResults({ status: 'ready', places, error: '' });
        // Text Search puede devolver lugares fuera de la zona visible
        if (request.query && places.length > 0) {
          mapRef.current?.fitToCoordinates(
            places.map((place) => place.location),
            { edgePadding: FIT_EDGE_PADDING, animated: true }
          );
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setResults({ status: 'error', places: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [request]);

  const startSearch = (changes: Partial<SearchRequest>) => {
    if (!request) return;
    Keyboard.dismiss();
    setSelectedId(null);
    setResults((current) => ({ ...current, status: 'loading', error: '' }));
    setRequest({ ...request, ...changes });
  };

  const selected = results.places.find((place) => place.id === selectedId) ?? null;
  const origin = position?.coordinates;

  // El usuario movió el mapa lejos de donde se buscó: se ofrece buscar ahí
  const movedAway =
    !!request &&
    !!visibleRegion &&
    distanceKm(request.center, visibleRegion) * 1000 > Math.max(500, request.radiusMeters * 0.3);

  const recenter = () => {
    if (origin) mapRef.current?.animateToRegion(toRegion(origin));
  };

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />

      {position ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={toRegion(position.coordinates)}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          mapPadding={{ top: headerHeight, right: 0, bottom: selected ? 130 : 0, left: 0 }}
          onRegionChangeComplete={setVisibleRegion}
          onPress={(event) => {
            // En iOS tocar un marcador también llega como toque del mapa
            if (event.nativeEvent.action !== 'marker-press') setSelectedId(null);
          }}
        >
          {results.places.map((place) => (
            <PlaceMarker
              key={`${place.id}-${place.id === selectedId}`}
              place={place}
              selected={place.id === selectedId}
              onPress={() => setSelectedId(place.id)}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <View
        style={[styles.header, { paddingTop: insets.top + 8 }]}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        pointerEvents="box-none"
      >
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar lugares"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => startSearch({ query: query.trim() })}
            accessibilityLabel="Buscar lugares"
          />
          {!!query && (
            <Pressable
              onPress={() => {
                setQuery('');
                if (request?.query) startSearch({ query: '' });
              }}
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              hitSlop={8}
            >
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          {SEARCH_CATEGORIES.map((category, index) => (
            <Chip
              key={category.label}
              label={category.label}
              selected={request?.categoryIndex === index}
              onPress={() => startSearch({ categoryIndex: index, query: query.trim() })}
            />
          ))}
        </ScrollView>

        <View style={styles.statusRow} pointerEvents="box-none">
          {results.status === 'loading' && (
            <View style={styles.statusPill}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>Buscando lugares…</Text>
            </View>
          )}
          {results.status === 'ready' && results.places.length === 0 && (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>No encontramos lugares aquí</Text>
            </View>
          )}
          {results.status === 'error' && (
            <Pressable
              style={styles.statusPill}
              onPress={() => startSearch({})}
              accessibilityRole="button"
            >
              <Text style={[styles.statusText, styles.errorText]}>{results.error}</Text>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          )}
          {results.status !== 'loading' && movedAway && visibleRegion && (
            <Pressable
              style={({ pressed }) => [styles.statusPill, pressed && styles.pressed]}
              onPress={() =>
                startSearch({
                  center: { latitude: visibleRegion.latitude, longitude: visibleRegion.longitude },
                  radiusMeters: radiusForRegion(visibleRegion),
                })
              }
              accessibilityRole="button"
            >
              <RefreshCw size={14} color={colors.primary} />
              <Text style={styles.retryText}>Buscar en esta zona</Text>
            </Pressable>
          )}
        </View>
      </View>

      {origin && (
        <Pressable
          onPress={recenter}
          accessibilityRole="button"
          accessibilityLabel="Volver a mi ubicación"
          style={({ pressed }) => [
            styles.locateButton,
            { bottom: selected ? 150 : 20 },
            pressed && styles.pressed,
          ]}
        >
          <LocateFixed size={20} color={colors.textPrimary} />
        </Pressable>
      )}

      {selected && (
        <Pressable
          onPress={() => navigation.navigate('PlaceDetail', { place: selected })}
          accessibilityRole="button"
          accessibilityHint="Abre el detalle del lugar"
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          {selected.photoUrl ? (
            <Image source={{ uri: selected.photoUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <MapPin size={24} color={getPlaceCategoryStyle(selected.type).color} />
            </View>
          )}

          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {selected.name}
            </Text>
            {!!selected.category && (
              <Text style={styles.cardCategory} numberOfLines={1}>
                {selected.category}
              </Text>
            )}
            {origin && (
              <Text style={styles.cardMeta}>
                {distanceKm(origin, selected.location).toFixed(1)} km
              </Text>
            )}
            {selected.rating !== null && (
              <View style={styles.cardRating}>
                <Star size={13} color={colors.rating} fill={colors.rating} />
                <Text style={styles.cardRatingText}>
                  {selected.rating.toFixed(1)}
                  {selected.userRatingCount !== null && ` (${selected.userRatingCount})`}
                </Text>
              </View>
            )}
          </View>

          <FavoriteButton
            isFavorite={isFavoritePlace(selected.id)}
            itemName={selected.name}
            onPress={() => togglePlace(selected.id)}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapLoading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusRow: {
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '90%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.white,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: colors.textBody,
    flexShrink: 1,
  },
  errorText: {
    color: colors.danger,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  locateButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  cardImagePlaceholder: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textBody,
    marginTop: 4,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardRatingText: {
    fontSize: 12,
    color: colors.textBody,
  },
  pressed: {
    opacity: 0.8,
  },
});
