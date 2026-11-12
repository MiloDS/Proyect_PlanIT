import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Accessibility,
  Armchair,
  Baby,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  Clock,
  Dog,
  ExternalLink,
  LucideIcon,
  MapPin,
  Plus,
  Share2,
  SquareParking,
  Star,
  Tag,
  Toilet,
  Users,
} from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { Amenity, PlaceDetails } from '../types/places';
import { Plan } from '../types/plans';
import { SheetOption } from '../types/components';
import { Button } from '../components/Button';
import { FavoriteButton } from '../components/FavoriteButton';
import { OptionsSheet } from '../components/OptionsSheet';
import { PlaceImage } from '../components/PlaceImage';
import { useAuth } from '../services/AuthContext';
import { useFavorites } from '../services/FavoritesContext';
import { useDevicePosition } from '../services/useDevicePosition';
import { PRICE_LEVEL_LABELS, PlacesService, getTodayHours } from '../services/placesService';
import { PlansService } from '../services/plansService';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { formatShortDate, formatTime, isUpcoming } from '../utils/date';
import { distanceKm } from '../utils/geo';
import { getDefaultStayMinutes } from '../utils/itinerary';
import { messages } from '../utils/messages';

type Props = NativeStackScreenProps<AppStackParamList, 'PlaceDetail'>;

const AMENITIES: Record<Amenity, { Icon: LucideIcon; label: string }> = {
  restroom: { Icon: Toilet, label: 'Baños' },
  outdoorSeating: { Icon: Armchair, label: 'Mesas afuera' },
  allowsDogs: { Icon: Dog, label: 'Mascotas' },
  goodForChildren: { Icon: Baby, label: 'Niños' },
  parking: { Icon: SquareParking, label: 'Parqueadero' },
  wheelchair: { Icon: Accessibility, label: 'Accesible' },
};

const HEADER_IMAGE_HEIGHT = 280;

function getIdealFor(details: PlaceDetails | null): string {
  if (details?.goodForChildren) return 'Familias';
  if (details?.goodForGroups) return 'Grupos';
  return 'Todos';
}

function getOpeningStatus(details: PlaceDetails | null): string {
  if (details?.openNow === true) return 'Abierto';
  if (details?.openNow === false) return 'Cerrado';
  return 'Horario';
}

type InfoCardProps = { Icon: LucideIcon; title: string; value: string };

function InfoCard({ Icon, title, value }: InfoCardProps) {
  return (
    <View style={styles.infoCard} accessible accessibilityLabel={`${title}: ${value}`}>
      <Icon size={20} color={colors.textPrimary} />
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function PlaceDetailScreen({ navigation, route }: Props) {
  const { place } = route.params;
  const insets = useSafeAreaInsets();
  const position = useDevicePosition();
  const { user } = useAuth();
  const { isFavoritePlace, togglePlace } = useFavorites();
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  // Planes próximos que creó la persona: los que puede editar
  const [ownPlans, setOwnPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    PlacesService.getDetails(place.id)
      .then((result) => {
        if (!cancelled) setDetails(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [place.id, reloadKey]);

  const current = details ?? place;
  const isFavorite = isFavoritePlace(place.id);
  const photoUrl = details?.photoUrl ?? place.photoUrl;
  const todayHours = details ? getTodayHours(details.weekdayHours) : null;

  const retry = () => {
    setError('');
    setReloadKey((key) => key + 1);
  };

  const share = () => {
    Share.share({ message: `${current.name}\n${PlacesService.getMapsUrl(current)}` });
  };

  // Los planes se piden al tocar el botón, no cada vez que se abre un lugar
  const openAddToPlan = async () => {
    setLoadingPlans(true);
    try {
      const plans = await PlansService.list();
      setOwnPlans(
        plans.filter((plan) => plan.ownerId === user?.id && isUpcoming(new Date(plan.startsAt)))
      );
      setAddSheetOpen(true);
    } catch (err: any) {
      Alert.alert(messages.plans.addToPlanTitle, err.message);
    } finally {
      setLoadingPlans(false);
    }
  };

  const addToPlan = async (plan: Plan) => {
    try {
      const added =
        !plan.placeIds.includes(place.id) &&
        (await PlansService.addPlace(plan.id, place.id, getDefaultStayMinutes(current.type)));
      if (!added) {
        Alert.alert(messages.plans.addToPlanTitle, messages.plans.placeAlreadyInPlan(plan.title));
        return;
      }
      Alert.alert(
        messages.plans.placeAddedTitle,
        messages.plans.placeAdded(current.name, plan.title),
        [
          { text: 'Listo', style: 'cancel' },
          {
            text: 'Ver plan',
            onPress: () =>
              navigation.navigate('PlanDetail', {
                plan: { ...plan, placeIds: [...plan.placeIds, place.id] },
              }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(messages.plans.addToPlanTitle, err.message);
    }
  };

  const addOptions: SheetOption[] = [
    {
      label: 'Nuevo plan',
      description: 'Empieza un plan con este lugar',
      Icon: Plus,
      onPress: () => navigation.navigate('CreatePlan', { place }),
    },
    ...ownPlans.map((plan) => {
      const startsAt = new Date(plan.startsAt);
      return {
        label: plan.title,
        description: `${formatShortDate(startsAt)} · ${formatTime(startsAt)}`,
        Icon: CalendarDays,
        onPress: () => addToPlan(plan),
      };
    }),
  ];

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <PlaceImage
          uri={photoUrl}
          placeType={current.type}
          style={styles.headerImage}
          iconSize={56}
        />

        <View style={styles.sheet}>
          <Text style={styles.name}>{current.name}</Text>
          {!!current.category && <Text style={styles.category}>{current.category}</Text>}

          <View style={styles.metaRow}>
            {current.rating !== null && (
              <View style={styles.metaItem}>
                <Star size={15} color={colors.rating} fill={colors.rating} />
                <Text style={styles.metaStrong}>{current.rating.toFixed(1)}</Text>
                {current.userRatingCount !== null && (
                  <Text style={styles.metaText}>({current.userRatingCount} reseñas)</Text>
                )}
              </View>
            )}
            {position && (
              <View style={styles.metaItem}>
                <MapPin size={15} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {distanceKm(position.coordinates, current.location).toFixed(1)} km
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <InfoCard Icon={Clock} title={getOpeningStatus(details)} value={todayHours ?? '—'} />
            <InfoCard
              Icon={Tag}
              title="Precio"
              value={current.priceLevel ? PRICE_LEVEL_LABELS[current.priceLevel] : 'Sin info'}
            />
            <InfoCard Icon={Users} title="Ideal para" value={getIdealFor(details)} />
          </View>

          {!details && !error && (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={retry} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.link}>Reintentar</Text>
              </Pressable>
            </View>
          )}

          {!!details?.description && (
            <>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.body}>{details.description}</Text>
            </>
          )}

          {!!current.address && (
            <>
              <Text style={styles.sectionTitle}>Dirección</Text>
              <Text style={styles.body}>{current.address}</Text>
            </>
          )}

          {!!details && details.amenities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Servicios</Text>
              <View style={styles.amenities}>
                {details.amenities.map((amenity) => {
                  const { Icon, label } = AMENITIES[amenity];
                  return (
                    <View key={amenity} style={styles.amenity}>
                      <Icon size={20} color={colors.textBody} />
                      <Text style={styles.amenityLabel}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {!!details && details.weekdayHours.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Horario</Text>
              {details.weekdayHours.map((line) => (
                <Text key={line} style={styles.hoursLine}>
                  {line}
                </Text>
              ))}
            </>
          )}

          <Pressable
            onPress={() => PlacesService.openInMaps(current)}
            accessibilityRole="link"
            style={({ pressed }) => [styles.mapsLink, pressed && styles.pressed]}
          >
            <ExternalLink size={15} color={colors.primary} />
            <Text style={styles.link}>Ver en Google Maps</Text>
          </Pressable>
          <Text style={styles.attribution}>Datos de Google Maps</Text>
        </View>
      </ScrollView>

      <View style={[styles.topActions, { top: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.topActionsRight}>
          <FavoriteButton
            variant="floating"
            isFavorite={isFavorite}
            itemName={current.name}
            onPress={() => togglePlace(place.id)}
          />
          <Pressable
            onPress={share}
            accessibilityRole="button"
            accessibilityLabel="Compartir"
            style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
          >
            <Share2 size={19} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          variant="primary"
          style={styles.addToPlanButton}
          loading={loadingPlans}
          onPress={openAddToPlan}
        >
          <CalendarPlus size={18} color={colors.white} />
          <Text style={globalStyles.primaryButtonText}>Agregar a un plan</Text>
        </Button>
      </View>

      <OptionsSheet
        visible={addSheetOpen}
        title={messages.plans.addToPlanTitle}
        options={addOptions}
        onClose={() => setAddSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  headerImage: {
    width: '100%',
    height: HEADER_IMAGE_HEIGHT,
  },
  sheet: {
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  category: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaStrong: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  infoValue: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  loading: {
    marginTop: 20,
  },
  errorBox: {
    marginTop: 16,
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 22,
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textBody,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenity: {
    width: 76,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  amenityLabel: {
    fontSize: 10,
    color: colors.textBody,
    textAlign: 'center',
  },
  hoursLine: {
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  mapsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    alignSelf: 'flex-start',
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  attribution: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
  },
  topActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActionsRight: {
    flexDirection: 'row',
    gap: 10,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  pressed: {
    opacity: 0.7,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addToPlanButton: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 16,
  },
});
