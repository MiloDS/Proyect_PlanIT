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
import { CalendarDays, Clock, LucideIcon, Plus, X } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { Place } from '../types/places';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { PlaceListItem } from '../components/PlaceListItem';
import { PlacePickerModal } from '../components/PlacePickerModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { PlacesService } from '../services/placesService';
import { PlansService } from '../services/plansService';
import { useDevicePosition } from '../services/useDevicePosition';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { formatShortDate, formatTime, startOfDay } from '../utils/date';
import { distanceKm } from '../utils/geo';
import { messages } from '../utils/messages';

type Props = NativeStackScreenProps<AppStackParamList, 'CreatePlan'>;

type PickerMode = 'date' | 'time';

type FormErrors = {
  title?: string;
  startsAt?: string;
  places?: string;
};

const MAX_TITLE_LENGTH = 100;

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

/**
 * `allowPast`: al editar un plan que ya pasó se puede cambiar el nombre o los lugares
 * sin tener que moverlo al futuro
 */
function validate(title: string, startsAt: Date, places: Place[], allowPast: boolean): FormErrors {
  const errors: FormErrors = {};
  const trimmed = title.trim();
  if (!trimmed) errors.title = messages.validation.planTitleRequired;
  else if (trimmed.length > MAX_TITLE_LENGTH) {
    errors.title = messages.validation.tooLong(MAX_TITLE_LENGTH);
  }
  if (!allowPast && startsAt.getTime() < Date.now()) {
    errors.startsAt = messages.validation.planDateInPast;
  }
  if (places.length === 0) errors.places = messages.validation.planPlacesRequired;
  return errors;
}

type PickerFieldProps = {
  label: string;
  value: string;
  Icon: LucideIcon;
  onPress: () => void;
  error?: string;
};

function PickerField({ label, value, Icon, onPress, error }: PickerFieldProps) {
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
        <Icon size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

export function CreatePlanScreen({ navigation, route }: Props) {
  const editingPlan = route.params?.plan;
  const insets = useSafeAreaInsets();
  const position = useDevicePosition();
  const [title, setTitle] = useState(editingPlan?.title ?? '');
  const [startsAt, setStartsAt] = useState(() =>
    editingPlan ? new Date(editingPlan.startsAt) : getDefaultStart()
  );
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesStatus, setPlacesStatus] = useState<'loading' | 'ready' | 'error'>(
    editingPlan ? 'loading' : 'ready'
  );
  const [placesReloadKey, setPlacesReloadKey] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [iosPickerMode, setIosPickerMode] = useState<PickerMode | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const changeStartsAt = (picked: Date, mode: PickerMode) => {
    setStartsAt((current) => mergePickedValue(current, picked, mode));
    setErrors((current) => ({ ...current, startsAt: undefined }));
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
    setErrors((current) => ({ ...current, places: undefined }));
  };

  const handleSave = async () => {
    const keepsPastDate =
      !!editingPlan && startsAt.getTime() === new Date(editingPlan.startsAt).getTime();
    const formErrors = validate(title, startsAt, places, keepsPastDate);
    setErrors(formErrors);
    setSaveError('');
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const plan = { title, startsAt, placeIds: places.map((place) => place.id) };
      if (editingPlan) await PlansService.update(editingPlan.id, plan);
      else await PlansService.create(plan);
      // Mis planes y el detalle del plan se recargan al volver a mostrarse
      navigation.goBack();
    } catch (err: any) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />

      <ScreenHeader
        title={editingPlan ? 'Editar plan' : 'Crear plan'}
        subtitle={editingPlan ? 'Cambia lo que necesites' : 'Dale un nombre a tu plan'}
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
              if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
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
            />
            <PickerField
              label="Hora"
              value={formatTime(startsAt)}
              Icon={Clock}
              onPress={() => openDateTimePicker('time')}
              error={errors.startsAt}
            />
          </View>
          {!!errors.startsAt && <Text style={styles.errorText}>{errors.startsAt}</Text>}

          <Text style={[styles.label, styles.placesLabel]}>Lugares</Text>
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
          <View style={styles.places}>
            {places.map((place) => (
              <PlaceListItem
                key={place.id}
                place={place}
                distanceKm={position ? distanceKm(position.coordinates, place.location) : null}
                showRating={false}
                action={
                  <Pressable
                    onPress={() => togglePlace(place)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${place.name}`}
                    hitSlop={8}
                  >
                    <X size={18} color={colors.textSecondary} />
                  </Pressable>
                }
              />
            ))}
          </View>

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
              {editingPlan ? 'Guardar cambios' : 'Guardar plan'}
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

      <PlacePickerModal
        visible={pickerOpen}
        selectedIds={places.map((place) => place.id)}
        onToggle={togglePlace}
        onClose={() => setPickerOpen(false)}
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

const styles = StyleSheet.create({
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
  placesLabel: {
    marginTop: 20,
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
  places: {
    gap: 10,
  },
  addPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
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
  saveButton: {
    borderRadius: 16,
  },
  iosOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  iosSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
