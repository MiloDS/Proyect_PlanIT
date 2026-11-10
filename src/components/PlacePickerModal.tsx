import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Heart, Plus, Search, SearchX, X } from 'lucide-react-native';

import { PlacePickerModalProps } from '../types/components';
import { Coordinates, Place } from '../types/places';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { PlaceListItem } from './PlaceListItem';
import { SegmentedControl } from './SegmentedControl';
import { useFavorites } from '../services/FavoritesContext';
import { LocationService } from '../services/locationService';
import { PlacesService } from '../services/placesService';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { distanceKm } from '../utils/geo';

type Source = 'nearby' | 'favorites';

type PickerRequest = {
  source: Source;
  query: string;
};

type PickerResults = {
  status: 'loading' | 'ready' | 'error';
  origin: Coordinates | null;
  places: Place[];
  error: string;
};

const SOURCES: { value: Source; label: string }[] = [
  { value: 'nearby', label: 'Cerca de ti' },
  { value: 'favorites', label: 'Favoritos' },
];
const TEXT_SEARCH_RADIUS_METERS = 15000;

// El contenido solo se monta con el modal abierto: cada vez empieza de cero
function PlacePickerContent({ selectedIds, onToggle, onClose }: PlacePickerModalProps) {
  const insets = useSafeAreaInsets();
  const favorites = useFavorites();
  const [query, setQuery] = useState('');
  const [request, setRequest] = useState<PickerRequest>({ source: 'nearby', query: '' });
  const [results, setResults] = useState<PickerResults>({
    status: 'loading',
    origin: null,
    places: [],
    error: '',
  });
  // Solo la pestaña Favoritos depende de los IDs guardados
  const favoriteIdsKey =
    request.source === 'favorites' && !request.query
      ? favorites.places.map((entry) => entry.id).join(',')
      : '';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { coordinates } = await LocationService.getCurrentPosition();
        let places: Place[];
        if (request.query) {
          places = await PlacesService.searchText({
            query: request.query,
            location: coordinates,
            radiusMeters: TEXT_SEARCH_RADIUS_METERS,
            maxResults: 20,
          });
        } else if (request.source === 'favorites') {
          places = await PlacesService.lookup(favoriteIdsKey ? favoriteIdsKey.split(',') : []);
        } else {
          places = await PlacesService.getNearbyPlaces(coordinates);
        }
        if (!cancelled) setResults({ status: 'ready', origin: coordinates, places, error: '' });
      } catch (err: any) {
        if (!cancelled) {
          setResults({ status: 'error', origin: null, places: [], error: err.message });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [request, favoriteIdsKey]);

  const changeRequest = (changes: Partial<PickerRequest>) => {
    Keyboard.dismiss();
    setResults((current) => ({ ...current, status: 'loading', error: '' }));
    setRequest((current) => ({ ...current, ...changes }));
  };

  const clearQuery = () => {
    setQuery('');
    if (request.query) changeRequest({ query: '' });
  };

  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Agregar lugares
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={8}
          style={styles.closeButton}
        >
          <X size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar un lugar"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => changeRequest({ query: query.trim() })}
          accessibilityLabel="Buscar un lugar"
        />
        {!!query && (
          <Pressable
            onPress={clearQuery}
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
            hitSlop={8}
          >
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {!request.query && (
        <View style={styles.sources}>
          <SegmentedControl
            options={SOURCES}
            value={request.source}
            onChange={(source) => changeRequest({ source })}
          />
        </View>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {results.status === 'loading' && (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        )}

        {results.status === 'error' && (
          <EmptyState
            icon={<SearchX size={28} color={colors.primary} />}
            title="No pudimos cargar los lugares"
            message={results.error}
            actionLabel="Reintentar"
            onAction={() => changeRequest({})}
          />
        )}

        {results.status === 'ready' && results.places.length === 0 && (
          <EmptyState
            icon={
              request.source === 'favorites' && !request.query ? (
                <Heart size={28} color={colors.primary} />
              ) : (
                <SearchX size={28} color={colors.primary} />
              )
            }
            title={
              request.source === 'favorites' && !request.query
                ? 'Aún no tienes lugares favoritos'
                : 'No encontramos lugares'
            }
            message="Prueba buscando por nombre."
          />
        )}

        {results.status === 'ready' &&
          results.places.map((place) => {
            const selected = selectedIds.includes(place.id);
            return (
              <PlaceListItem
                key={place.id}
                place={place}
                distanceKm={results.origin ? distanceKm(results.origin, place.location) : null}
                showRating={false}
                onPress={() => onToggle(place)}
                action={
                  <View
                    style={[styles.toggle, selected && styles.toggleSelected]}
                    accessibilityLabel={selected ? 'Agregado' : 'Agregar'}
                  >
                    {selected ? (
                      <Check size={16} color={colors.white} />
                    ) : (
                      <Plus size={16} color={colors.primary} />
                    )}
                  </View>
                }
              />
            );
          })}
      </ScrollView>

      <Button variant="primary" style={styles.doneButton} onPress={onClose}>
        <Text style={globalStyles.primaryButtonText}>
          {selectedIds.length > 0 ? `Listo (${selectedIds.length})` : 'Listo'}
        </Text>
      </Button>
    </View>
  );
}

export function PlacePickerModal(props: PlacePickerModalProps) {
  return (
    <Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
      <View style={styles.overlay}>{props.visible && <PlacePickerContent {...props} />}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '88%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  sources: {
    marginTop: 12,
  },
  list: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    gap: 10,
    paddingBottom: 12,
  },
  loading: {
    marginTop: 32,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSelected: {
    backgroundColor: colors.primary,
  },
  doneButton: {
    marginTop: 8,
    borderRadius: 16,
  },
});
