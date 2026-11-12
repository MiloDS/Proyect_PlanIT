import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CloudOff, CloudRain, LucideIcon, Moon, SearchX, Sun, Users } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { Coordinates, Place, RecommendationNote } from '../types/places';
import { EmptyState } from '../components/EmptyState';
import { FavoriteButton } from '../components/FavoriteButton';
import { PlaceListItem } from '../components/PlaceListItem';
import { ScreenHeader } from '../components/ScreenHeader';
import { useFavorites } from '../services/FavoritesContext';
import { LocationService } from '../services/locationService';
import { RecommendationsService } from '../services/recommendationsService';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { distanceKm } from '../utils/geo';
import { messages } from '../utils/messages';

type Props = NativeStackScreenProps<AppStackParamList, 'Recommendations'>;

type RecommendationsState = {
  status: 'loading' | 'ready' | 'error';
  origin: Coordinates | null;
  places: Place[];
  notes: RecommendationNote[];
  error: string;
};

const NOTE_ICONS: Record<RecommendationNote['kind'], LucideIcon> = {
  rain: CloudRain,
  night: Moon,
  sun: Sun,
  noWeather: CloudOff,
  company: Users,
};

export function RecommendationsScreen({ navigation, route }: Props) {
  const { preferences } = route.params;
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const styles = makeStyles(themeColors);
  const { isFavoritePlace, togglePlace } = useFavorites();
  const [state, setState] = useState<RecommendationsState>({
    status: 'loading',
    origin: null,
    places: [],
    notes: [],
    error: '',
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { coordinates } = await LocationService.getCurrentPosition();
        const { places, notes } = await RecommendationsService.get(coordinates, preferences);
        if (!cancelled) {
          setState({ status: 'ready', origin: coordinates, places, notes, error: '' });
        }
      } catch (err: any) {
        if (!cancelled) {
          setState({ status: 'error', origin: null, places: [], notes: [], error: err.message });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [preferences, reloadKey]);

  const retry = () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    setReloadKey((key) => key + 1);
  };

  const summary = [
    preferences.activities.join(', '),
    preferences.budget,
    `${preferences.maxDistanceKm} km`,
    preferences.company,
  ].join(' · ');
  const usesWeather = state.notes.some((note) => ['rain', 'night', 'sun'].includes(note.kind));

  return (
    <View style={[globalStyles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScreenHeader title="Recomendaciones para ti" onBack={() => navigation.goBack()}>
        <View style={styles.summary}>
          <Text style={styles.summaryText} numberOfLines={2}>
            {summary}
          </Text>
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {state.status === 'loading' && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Buscando los mejores lugares…</Text>
          </View>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CloudOff size={28} color={colors.primary} />}
            title={messages.places.recommendationsFailedTitle}
            message={state.error}
            actionLabel="Reintentar"
            onAction={retry}
          />
        )}

        {state.status === 'ready' && state.notes.length > 0 && (
          <View style={styles.notes}>
            {state.notes.map((note) => {
              const Icon = NOTE_ICONS[note.kind];
              return (
                <View key={note.kind} style={styles.note}>
                  <Icon size={16} color={colors.primaryDark} />
                  <Text style={styles.noteText}>{note.text}</Text>
                </View>
              );
            })}
            {usesWeather && <Text style={styles.noteCredit}>Clima: Open-Meteo</Text>}
          </View>
        )}

        {state.status === 'ready' && state.places.length === 0 && (
          <EmptyState
            icon={<SearchX size={28} color={colors.primary} />}
            title="No encontramos lugares con esos filtros"
            message="Prueba con más distancia, otro presupuesto u otra actividad."
            actionLabel="Cambiar preferencias"
            onAction={() => navigation.goBack()}
          />
        )}

        {state.status === 'ready' && state.places.length > 0 && (
          <>
            <View style={styles.list}>
              {state.places.map((place) => (
                <PlaceListItem
                  key={place.id}
                  place={place}
                  distanceKm={state.origin ? distanceKm(state.origin, place.location) : null}
                  onPress={() => navigation.navigate('PlaceDetail', { place })}
                  action={
                    <FavoriteButton
                      size={18}
                      isFavorite={isFavoritePlace(place.id)}
                      itemName={place.name}
                      onPress={() => togglePlace(place.id)}
                    />
                  }
                />
              ))}
            </View>
            <Text style={styles.attribution}>Datos de Google Maps</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  summary: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  notes: {
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    marginBottom: 16,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  noteCredit: {
    fontSize: 10,
    color: colors.primaryDark,
    opacity: 0.7,
    textAlign: 'right',
  },
  list: {
    gap: 12,
  },
  attribution: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 12,
  },
});
}
