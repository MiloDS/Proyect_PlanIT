import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Sparkles } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { CustomSlider } from '../components/CustomSlider';
import { ScreenHeader } from '../components/ScreenHeader';
import { ACTIVITY_PLACE_TYPES, BUDGET_PRICE_LEVELS } from '../services/placesService';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'SurpriseMe'>;

const ACTIVITY_OPTIONS = Object.keys(ACTIVITY_PLACE_TYPES);
const BUDGET_OPTIONS = Object.keys(BUDGET_PRICE_LEVELS);
const COMPANY_OPTIONS = ['Solo', 'Pareja', 'Amigos', 'Familia'];
const MIN_DISTANCE_KM = 1;
const MAX_DISTANCE_KM = 50;

export function SurpriseMeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['Aire libre']);
  const [selectedBudget, setSelectedBudget] = useState('Bajo');
  const [maxDistance, setMaxDistance] = useState(5);
  const [selectedCompany, setSelectedCompany] = useState('Amigos');
  const toggleActivity = (activity: string) => {
    if (!selectedActivities.includes(activity)) {
      setSelectedActivities([...selectedActivities, activity]);
    } else if (selectedActivities.length > 1) {
      // Siempre debe quedar al menos una actividad
      setSelectedActivities(selectedActivities.filter((item) => item !== activity));
    }
  };

  // La búsqueda se hace en Recomendaciones para mostrar ahí la carga y los resultados
  const showRecommendations = () => {
    navigation.navigate('Recommendations', {
      preferences: {
        activities: selectedActivities,
        budget: selectedBudget,
        maxDistanceKm: maxDistance,
        company: selectedCompany,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Sorpréndeme"
        subtitle="Cuéntanos tus preferencias"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de actividad</Text>
          <View style={styles.activityContainer}>
            {ACTIVITY_OPTIONS.map((activity) => (
              <Chip
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
              <Chip
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
              <Chip
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
        <Button variant="primary" style={styles.recommendButton} onPress={showRecommendations}>
          <Sparkles size={18} color={colors.white} />
          <Text style={styles.recommendButtonText}>Ver recomendaciones</Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
});
