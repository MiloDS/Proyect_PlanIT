import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarDays, Clock, Hourglass, LucideIcon, Plus } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { Place } from '../types/places';
import { NewPlan, PlanFormErrors, TransportMode } from '../types/plans';
import { SheetOption } from '../types/components';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ItineraryList, ItinerarySummary } from '../components/Itinerary';
import { OptionsSheet } from '../components/OptionsSheet';
import { PlacePickerModal } from '../components/PlacePickerModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { SegmentedControl } from '../components/SegmentedControl';
import { PlacesService } from '../services/placesService';
import { PlansService } from '../services/plansService';
import { useDevicePosition } from '../services/useDevicePosition';
import { useRouteLegs } from '../services/useRouteLegs';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { formatPesos, parsePesos } from '../utils/currency';
import { formatDuration, formatShortDate, formatTime, startOfDay } from '../utils/date';
import { distanceKm } from '../utils/geo';
import {
  buildItinerary,
  DEFAULT_STAY_MINUTES,
  DEFAULT_TRANSPORT_MODE,
  getDefaultStayMinutes,
  STAY_OPTIONS,
  TRANSPORT_MODES,
} from '../utils/itinerary';
import { messages } from '../utils/messages';
import { MAX_PLAN_NOTES_LENGTH, validatePlan } from '../utils/validation';

type Props = NativeStackScreenProps<AppStackParamList, 'CreatePlan'>;

type PickerMode = 'date' | 'time';

// La próxima hora en punto: un valor razonable para un plan de hoy
function getDefaultStart(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}

// Combina la fecha o la hora elegida con el resto del valor actual
function mergePickedValue(current: Date, picked: Date, mode: PickerMode): Date {
  const merged = new Date(current);
  if (mode === 'date') {
    merged.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  } else {
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  }
  return merged;
}

type PickerFieldProps = {
  label: string;
  value: string;
  Icon: LucideIcon;
  onPress: () => void;
  error?: string;
};

function PickerField({
  label,
  value,
  Icon,
  onPress,
  error,
  styles,
  iconColor,
}: PickerFieldProps & { styles: ReturnType<typeof makeStyles>; iconColor: string }) {
  return (
    <View style={styles.pickerField}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityHint="Abre el selector"
        style={({ pressed }) => [
          styles.pickerInput,
          !!error && styles.inputError,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.pickerValue}>{value}</Text>
        <Icon size={18} color={iconColor} />
      </Pressable>
    </View>
  );
}

export function CreatePlanScreen({ navigation, route }: Props) {
  const editingPlan = route.params?.plan;
  // Lugar elegido desde su ficha con "Agregar a un plan" → "Nuevo plan"
  const initialPlace = route.params?.place;
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const styles = makeStyles(themeColors);
  const position = useDevicePosition();
  const [title, setTitle] = useState(editingPlan?.title ?? '');
  const [startsAt, setStartsAt] = useState(() =>
    editingPlan ? new Date(editingPlan.startsAt) : getDefaultStart()
  );
  const [places, setPlaces] = useState<Place[]>(initialPlace ? [initialPlace] : []);
  const [stayMinutes, setStayMinutes] = useState<Record<string, number>>(() => {
    if (editingPlan) return editingPlan.stayMinutes;
    return initialPlace ? { [initialPlace.id]: getDefaultStayMinutes(initialPlace.type) } : {};
  });
  const [transportMode, setTransportMode] = useState<TransportMode>(
    editingPlan?.transportMode ?? DEFAULT_TRANSPORT_MODE
  );
  const [budgetText, setBudgetText] = useState(
    editingPlan?.budgetPerPerson != null ? formatPesos(editingPlan.budgetPerPerson) : ''
  );
  const [notes, setNotes] = useState(editingPlan?.notes ?? '');
  const [placesStatus, setPlacesStatus] = useState<'loading' | 'ready' | 'error'>(
    editingPlan ? 'loading' : 'ready'
  );
  const [placesReloadKey, setPlacesReloadKey] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [iosPickerMode, setIosPickerMode] = useState<PickerMode | null>(null);
  const [stayEditIndex, setStayEditIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<PlanFormErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const placeIds = places.map((place) => place.id);
  const routeLegs = useRouteLegs(placeIds, transportMode);
  const itinerary = buildItinerary(startsAt, placeIds, stayMinutes, routeLegs.legs);

  // Al editar se cargan los datos de Google de los lugares que ya tiene el plan. Los que
  // Google ya no tiene (cerrados o eliminados) no vuelven y se quitan al guardar.
  useEffect(() => {
    if (!editingPlan) return;
    let cancelled = false;

    PlacesService.lookup(editingPlan.placeIds)
      .then((found) => {
        if (cancelled) return;
        // Se respetan los lugares que el usuario alcanzó a agregar mientras cargaba
        setPlaces((current) => [
          ...found,
          ...current.filter((place) => !found.some((item) => item.id === place.id)),
        ]);
        setPlacesStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setPlacesStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [editingPlan, placesReloadKey]);

  const retryPlaces = () => {
    setPlacesStatus('loading');
    setPlacesReloadKey((key) => key + 1);
  };

  const clearError = (field: keyof PlanFormErrors) => {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const changeStartsAt = (picked: Date, mode: PickerMode) => {
    setStartsAt((current) => mergePickedValue(current, picked, mode));
    clearError('startsAt');
  };

  const openDateTimePicker = (mode: PickerMode) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: startsAt,
        mode,
        minimumDate: mode === 'date' ? startOfDay(new Date()) : undefined,
        onValueChange: (_event, picked) => changeStartsAt(picked, mode),
      });
    } else {
      setIosPickerMode(mode);
    }
  };

  const togglePlace = (place: Place) => {
    setPlaces((current) =>
      current.some((item) => item.id === place.id)
        ? current.filter((item) => item.id !== place.id)
        : [...current, place]
    );
    // Cada lugar nuevo empieza con un tiempo típico para su tipo; se puede cambiar
    setStayMinutes((current) =>
      current[place.id] === undefined
        ? { ...current, [place.id]: getDefaultStayMinutes(place.type) }
        : current
    );
    clearError('places');
  };

  const movePlace = (index: number, direction: -1 | 1) => {
    setPlaces((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const stayOptions: SheetOption[] =
    stayEditIndex === null || !places[stayEditIndex]
      ? []
      : STAY_OPTIONS.map((minutes) => {
          const placeId = places[stayEditIndex].id;
          return {
            label: formatDuration(minutes),
            Icon: Hourglass,
            selected: (stayMinutes[placeId] ?? DEFAULT_STAY_MINUTES) === minutes,
            onPress: () => setStayMinutes((current) => ({ ...current, [placeId]: minutes })),
          };
        });

  const handleSave = async () => {
    const budgetPerPerson = parsePesos(budgetText);
    // Al editar un plan que ya pasó se puede cambiar el resto sin moverlo al futuro
    const keepsPastDate =
      !!editingPlan && startsAt.getTime() === new Date(editingPlan.startsAt).getTime();
    const formErrors = validatePlan(
      { title, startsAt, placeCount: places.length, notes, budgetPerPerson },
      { allowPast: keepsPastDate }
    );
    setErrors(formErrors);
    setSaveError('');
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    const plan: NewPlan = {
      title,
      startsAt,
      placeIds,
      stayMinutes,
      transportMode,
      budgetPerPerson,
      notes,
    };
    try {
      if (editingPlan) {
        await PlansService.update(editingPlan.id, plan);
        // El detalle del plan se recarga al volver a mostrarse
        navigation.goBack();
        return;
      }
      const planId = await PlansService.create(plan);
      // Se abre el plan recién creado, listo para invitar a los amigos
      const created = await PlansService.get(planId).catch(() => null);
      if (created) navigation.replace('PlanDetail', { plan: created });
      else navigation.goBack();
    } catch (err: any) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  return (
    <View style={[globalStyles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScreenHeader
        title={editingPlan ? 'Editar plan' : 'Crear plan'}
        subtitle={editingPlan ? 'Cambia lo que necesites' : 'Arma el recorrido de tu plan'}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <InputField
            label="Nombre del plan"
            placeholder="Tarde con amigos"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              clearError('title');
            }}
            autoCapitalize="sentences"
            error={errors.title}
          />

          <View style={styles.dateRow}>
            <PickerField
              label="Fecha"
              value={formatShortDate(startsAt)}
              Icon={CalendarDays}
              onPress={() => openDateTimePicker('date')}
              error={errors.startsAt}
              styles={styles}
              iconColor={themeColors.textSecondary}
            />
            <PickerField
              label="Hora de inicio"
              value={formatTime(startsAt)}
              Icon={Clock}
              onPress={() => openDateTimePicker('time')}
              error={errors.startsAt}
              styles={styles}
              iconColor={themeColors.textSecondary}
            />
          </View>
          {!!errors.startsAt && <Text style={styles.errorText}>{errors.startsAt}</Text>}

          <Text style={[styles.label, styles.sectionLabel]}>Cómo se mueven</Text>
          <SegmentedControl
            options={TRANSPORT_MODES.map(({ value, label }) => ({ value, label }))}
            value={transportMode}
            onChange={setTransportMode}
          />

          <Text style={[styles.label, styles.sectionLabel]}>Itinerario</Text>
          {placesStatus === 'loading' && (
            <ActivityIndicator color={colors.primary} style={styles.placesLoading} />
          )}
          {placesStatus === 'error' && (
            <View style={styles.placesError}>
              <Text style={styles.placesErrorText}>{messages.plans.placesLoadFailed}</Text>
              <Pressable onPress={retryPlaces} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.addPlaceText}>Reintentar</Text>
              </Pressable>
            </View>
          )}
          {places.length === 0 && placesStatus === 'ready' && (
            <Text style={styles.hint}>
              Agrega los lugares en el orden en que los van a visitar. Calculamos a qué hora llegan
              a cada uno y cuánto se demoran entre ellos.
            </Text>
          )}

          <ItineraryList
            places={places}
            itinerary={itinerary}
            transportMode={transportMode}
            legs={routeLegs.legs}
            legsLoading={routeLegs.loading}
            getDistanceKm={(place) =>
              position ? distanceKm(position.coordinates, place.location) : null
            }
            onMove={movePlace}
            onRemove={(index) => togglePlace(places[index])}
            onChangeStay={setStayEditIndex}
          />

          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.addPlace,
              !!errors.places && styles.addPlaceError,
              pressed && styles.pressed,
            ]}
          >
            <Plus size={18} color={colors.primary} />
            <Text style={styles.addPlaceText}>Agregar lugar</Text>
          </Pressable>
          {!!errors.places && <Text style={styles.errorText}>{errors.places}</Text>}

          {places.length > 0 && (
            <ItinerarySummary
              itinerary={itinerary}
              legsLoading={routeLegs.loading}
              legsError={routeLegs.error}
              onRetryLegs={routeLegs.retry}
            />
          )}

          <View style={styles.extras}>
            <InputField
              label="Presupuesto por persona (opcional)"
              placeholder="$0"
              value={budgetText}
              onChangeText={(text) => {
                const amount = parsePesos(text);
                setBudgetText(amount === null ? '' : formatPesos(amount));
                clearError('budget');
              }}
              keyboardType="number-pad"
              error={errors.budget}
            />
            <InputField
              label="Notas (opcional)"
              placeholder="Nos vemos en la entrada. Lleven efectivo."
              value={notes}
              onChangeText={(text) => {
                setNotes(text);
                clearError('notes');
              }}
              autoCapitalize="sentences"
              maxLength={MAX_PLAN_NOTES_LENGTH}
              multiline
              error={errors.notes}
            />
          </View>
        </ScrollView>

        <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {!!saveError && <Banner type="error" message={saveError} />}
          <Button
            variant="primary"
            style={styles.saveButton}
            loading={saving}
            // Guardar sin los lugares cargados los borraría del plan
            disabled={placesStatus !== 'ready'}
            onPress={handleSave}
          >
            <Text style={globalStyles.primaryButtonText}>
              {editingPlan ? 'Guardar cambios' : 'Crear plan'}
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

      <PlacePickerModal
        visible={pickerOpen}
        selectedIds={placeIds}
        onToggle={togglePlace}
        onClose={() => setPickerOpen(false)}
      />

      <OptionsSheet
        visible={stayEditIndex !== null}
        title={
          stayEditIndex !== null && places[stayEditIndex]
            ? `Tiempo en ${places[stayEditIndex].name}`
            : 'Tiempo en el lugar'
        }
        options={stayOptions}
        onClose={() => setStayEditIndex(null)}
      />

      {Platform.OS === 'ios' && (
        <Modal
          visible={iosPickerMode !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setIosPickerMode(null)}
        >
          <View style={styles.iosOverlay}>
            <View style={[styles.iosSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {iosPickerMode && (
                <DateTimePicker
                  value={startsAt}
                  mode={iosPickerMode}
                  display="spinner"
                  locale="es-CO"
                  minimumDate={iosPickerMode === 'date' ? startOfDay(new Date()) : undefined}
                  onValueChange={(_event, picked) => changeStartsAt(picked, iosPickerMode)}
                />
              )}
              <Button
                variant="primary"
                style={styles.saveButton}
                onPress={() => setIosPickerMode(null)}
              >
                <Text style={globalStyles.primaryButtonText}>Listo</Text>
              </Button>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
  },
  label: {
    fontSize: 13,
    color: colors.textBody,
    marginBottom: 6,
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerField: {
    flex: 1,
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  pickerValue: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  placesLoading: {
    marginVertical: 12,
  },
  placesError: {
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  placesErrorText: {
    fontSize: 13,
    color: colors.danger,
  },
  addPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  addPlaceError: {
    borderColor: colors.danger,
  },
  addPlaceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  extras: {
    marginTop: 24,
  },
  pressed: {
    opacity: 0.7,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    borderRadius: 16,
  },
  iosOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  iosSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
}
