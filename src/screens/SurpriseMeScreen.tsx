import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  Sparkles,
  MapPin,
  DollarSign,
  Users,
  RefreshCw,
  X,
} from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { Button } from '../components/Button';
import { CustomSlider } from '../components/CustomSlider';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'SurpriseMe'>;

const ACTIVITY_OPTIONS = ['Aire libre', 'Cultural', 'Relajación', 'Gastronomía', 'Entretenimiento'];
const BUDGET_OPTIONS = ['Bajo', 'Medio', 'Alto'];
const COMPANY_OPTIONS = ['Solo', 'Pareja', 'Amigos', 'Familia'];
const MIN_DISTANCE_KM = 1;
const MAX_DISTANCE_KM = 50;

type OptionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
};

function OptionChip({ label, selected, onPress, style }: OptionChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        style,
        selected ? styles.selectedButton : styles.unselectedButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={selected ? styles.selectedButtonText : styles.unselectedButtonText}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SurpriseMeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['Aire libre']);
  const [selectedBudget, setSelectedBudget] = useState('Bajo');
  const [maxDistance, setMaxDistance] = useState(5);
  const [selectedCompany, setSelectedCompany] = useState('Amigos');
  const [showResults, setShowResults] = useState(false);

  const toggleActivity = (activity: string) => {
    if (!selectedActivities.includes(activity)) {
      setSelectedActivities([...selectedActivities, activity]);
    } else if (selectedActivities.length > 1) {
      // Siempre debe quedar al menos una actividad
      setSelectedActivities(selectedActivities.filter((item) => item !== activity));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={({ pressed }) => [
            styles.backButton,
            { top: insets.top + 8 },
            pressed && styles.backButtonPressed,
          ]}
        >
          <ChevronLeft size={21} color={colors.textBody} />
        </Pressable>

        <Text style={styles.headerTitle}>Sorpréndeme</Text>
        <Text style={styles.headerSubtitle}>Cuéntanos tus preferencias</Text>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de actividad</Text>
          <View style={styles.activityContainer}>
            {ACTIVITY_OPTIONS.map((activity) => (
              <OptionChip
                key={activity}
                label={activity}
                selected={selectedActivities.includes(activity)}
                onPress={() => toggleActivity(activity)}
                style={styles.activityButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Presupuesto</Text>
          <View style={styles.budgetContainer}>
            {BUDGET_OPTIONS.map((budget) => (
              <OptionChip
                key={budget}
                label={budget}
                selected={selectedBudget === budget}
                onPress={() => setSelectedBudget(budget)}
                style={styles.budgetButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.distanceHeader}>
            <Text style={styles.sectionTitle}>Distancia máxima</Text>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{maxDistance} km</Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <CustomSlider
              minimumValue={MIN_DISTANCE_KM}
              maximumValue={MAX_DISTANCE_KM}
              step={1}
              value={maxDistance}
              onValueChange={(value) => setMaxDistance(Math.round(value))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.primaryLight}
              thumbTintColor={colors.primary}
            />

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{MIN_DISTANCE_KM} km</Text>
              <Text style={styles.sliderLabel}>25 km</Text>
              <Text style={styles.sliderLabel}>{MAX_DISTANCE_KM} km</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compañía</Text>
          <View style={styles.companyContainer}>
            {COMPANY_OPTIONS.map((company) => (
              <OptionChip
                key={company}
                label={company}
                selected={selectedCompany === company}
                onPress={() => setSelectedCompany(company)}
                style={styles.companyButton}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <Button
          variant="primary"
          style={styles.recommendButton}
          onPress={() => setShowResults(true)}
        >
          <Sparkles size={18} color={colors.white} />
          <Text style={styles.recommendButtonText}>Ver recomendaciones</Text>
        </Button>
      </View>

      <Modal
        visible={showResults}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResults(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Pressable
              onPress={() => setShowResults(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
            >
              <X size={18} color={colors.textSecondary} />
            </Pressable>

            <View style={styles.modalHandle} />

            <View style={styles.resultHeader}>
              <View style={styles.sparkleContainer}>
                <Sparkles size={25} color={colors.primary} />
              </View>
              <Text style={styles.resultTitle}>¡Plan recomendado!</Text>
              <Text style={styles.resultSubtitle}>Seleccionado para ti y tus filtros</Text>
            </View>

            {/* Recomendación de ejemplo hasta conectar la API de lugares */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <View style={styles.activityBadge}>
                    <Text style={styles.activityBadgeText}>{selectedActivities.join(', ')}</Text>
                  </View>
                  <Text style={styles.planTitle}>Parque Ecológico Arví</Text>
                </View>

                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>4.8 ★</Text>
                </View>
              </View>

              <View style={styles.planDetails}>
                <View style={styles.detailRow}>
                  <MapPin size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>A 3.2 km de tu ubicación</Text>
                </View>
                <View style={styles.detailRow}>
                  <DollarSign size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>Presupuesto: {selectedBudget}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Users size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>Plan para: {selectedCompany}</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                variant="primary"
                style={styles.exploreButton}
                onPress={() => setShowResults(false)}
              >
                <Text style={styles.exploreButtonText}>Explorar este plan</Text>
              </Button>

              <Pressable
                onPress={() => setShowResults(false)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.tryAgainButton, pressed && styles.buttonPressed]}
              >
                <RefreshCw size={15} color={colors.textBody} />
                <Text style={styles.tryAgainText}>Probar con otras opciones</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  /* Encabezado */
  header: {
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.borderStrong,
    transform: [{ scale: 0.95 }],
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },

  /* Formulario */
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 25,
  },
  section: {
    marginBottom: 27,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  activityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  activityButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: 9,
  },
  budgetButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyContainer: {
    flexDirection: 'row',
    gap: 7,
  },
  companyButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: colors.primary,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  unselectedButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  selectedButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  unselectedButtonText: {
    color: colors.textBody,
    fontSize: 12,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },

  /* Distancia */
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  distanceText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  sliderContainer: {
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sliderLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },

  /* Botón inferior */
  bottomAction: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  recommendButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  recommendButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 18,
  },
  closeButton: {
    position: 'absolute',
    right: 18,
    top: 15,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  sparkleContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  resultSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  /* Tarjeta del plan */
  planCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
    paddingRight: 8,
  },
  activityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  planTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  ratingBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ratingText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  planDetails: {
    marginTop: 15,
    gap: 9,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: colors.textBody,
    fontSize: 12,
  },

  /* Acciones del modal */
  modalActions: {
    marginTop: 18,
    gap: 9,
  },
  exploreButton: {
    height: 50,
    borderRadius: 16,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  exploreButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  tryAgainButton: {
    height: 46,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  tryAgainText: {
    color: colors.textBody,
    fontSize: 12,
    fontWeight: '600',
  },
});
