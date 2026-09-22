import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomSlider } from '../components/CustomSlider';
import { ChevronLeft, Signal, Wifi, Battery, Sparkles, MapPin, DollarSign, Users, RefreshCw, X, } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<AppStackParamList, "SurpriseMe"> & {
  onSubmit?: (preferences: any) => void;
};

export function SurpriseMeScreen({
  navigation,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();

  // TIPOS DE ACTIVIDAD
  const activityOptions = [
    'Aire libre',
    'Cultural',
    'Relajación',
    'Gastronomía',
    'Entretenimiento',
  ];

  const [selectedActivities, setSelectedActivities] =
    useState<string[]>(['Aire libre']);

  // PRESUPUESTO
  const budgetOptions = [
    'Bajo',
    'Medio',
    'Alto',
  ];

  const [selectedBudget, setSelectedBudget] =
    useState<string>('Bajo');

  // DISTANCIA
  const [maxDistance, setMaxDistance] =
    useState<number>(5);

  // COMPAÑÍA
  const companyOptions = [
    'Solo',
    'Pareja',
    'Amigos',
    'Familia',
  ];

  const [selectedCompany, setSelectedCompany] =
    useState<string>('Amigos');

  // MODAL DE RESULTADOS
  const [showResults, setShowResults] =
    useState<boolean>(false);

  // SELECCIONAR / DESELECCIONAR ACTIVIDAD
  const toggleActivity = (activity: string) => {

    if (selectedActivities.includes(activity)) {

      // Siempre debe quedar al menos una actividad
      if (selectedActivities.length > 1) {
        setSelectedActivities(
          selectedActivities.filter(
            (item) => item !== activity
          )
        );
      }

    } else {

      setSelectedActivities([
        ...selectedActivities,
        activity,
      ]);

    }
  };

  // VER RECOMENDACIONES
  const handleVerRecomendaciones = () => {

    setShowResults(true);

    if (onSubmit) {
      onSubmit({
        activities: selectedActivities,
        budget: selectedBudget,
        distance: maxDistance,
        company: selectedCompany,
      });
    }
  };

  // RENDER
  return (

      <View style={styles.container}>
        <StatusBar style="dark" />

        {/*HEADER*/}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>

          {/* Botón volver */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              { top: insets.top + 8 },
              pressed && styles.backButtonPressed,
            ]}
          >

            <ChevronLeft
              size={21}
              color="#374151"
            />

          </Pressable>

          {/* Título */}
          <Text style={styles.headerTitle}>
            Sorpréndeme
          </Text>

          <Text style={styles.headerSubtitle}>
            Cuéntanos tus preferencias
          </Text>
        </View>

        {/*FORMULARIO*/}
        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >

          {/*TIPO DE ACTIVIDAD*/}
          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Tipo de actividad
            </Text>

            <View style={styles.activityContainer}>

              {activityOptions.map((activity) => {

                const isSelected =
                  selectedActivities.includes(activity);

                return (
                  <Pressable
                    key={activity}
                    onPress={() =>
                      toggleActivity(activity)
                    }
                    style={({ pressed }) => [
                      styles.activityButton,

                      isSelected
                        ? styles.selectedButton
                        : styles.unselectedButton,

                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >

                    <Text
                      style={
                        isSelected
                          ? styles.selectedButtonText
                          : styles.unselectedButtonText
                      }
                    >
                      {activity}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/*PRESUPUESTO*/}
          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Presupuesto
            </Text>

            <View style={styles.budgetContainer}>

              {budgetOptions.map((budget) => {

                const isSelected =
                  selectedBudget === budget;

                return (
                  <Pressable
                    key={budget}
                    onPress={() =>
                      setSelectedBudget(budget)
                    }
                    style={({ pressed }) => [
                      styles.budgetButton,

                      isSelected
                        ? styles.selectedButton
                        : styles.unselectedButton,

                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >

                    <Text
                      style={
                        isSelected
                          ? styles.selectedButtonText
                          : styles.unselectedButtonText
                      }
                    >
                      {budget}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/*DISTANCIA MÁXIMA*/}
          <View style={styles.section}>

            <View style={styles.distanceHeader}>

              <Text style={styles.sectionTitle}>
                Distancia máxima
              </Text>

              <View style={styles.distanceBadge}>

                <Text style={styles.distanceText}>
                  {maxDistance} km
                </Text>
              </View>
            </View>

            <View style={styles.sliderContainer}>

              <CustomSlider
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={maxDistance}
                onValueChange={(value) =>
                  setMaxDistance(Math.round(value))
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.primaryLight}
                thumbTintColor={colors.primary}
              />

              <View style={styles.sliderLabels}>

                <Text style={styles.sliderLabel}>
                  1 km
                </Text>

                <Text style={styles.sliderLabel}>
                  25 km
                </Text>

                <Text style={styles.sliderLabel}>
                  50 km
                </Text>

              </View>
            </View>
          </View>

          {/*COMPAÑÍA*/}
          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Compañía
            </Text>

            <View style={styles.companyContainer}>

              {companyOptions.map((company) => {

                const isSelected =
                  selectedCompany === company;

                return (
                  <Pressable
                    key={company}
                    onPress={() =>
                      setSelectedCompany(company)
                    }
                    style={({ pressed }) => [
                      styles.companyButton,

                      isSelected
                        ? styles.selectedButton
                        : styles.unselectedButton,

                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={
                        isSelected
                          ? styles.selectedButtonText
                          : styles.unselectedButtonText
                      }
                    >
                      {company}
                    </Text>

                  </Pressable>
                );

              })}

            </View>
          </View>
        </ScrollView>

        {/*BOTÓN INFERIOR*/}
        <View style={[styles.bottomAction, { paddingBottom: insets.bottom > 0 ? insets.bottom : 18 }]}>

          <Pressable
            onPress={handleVerRecomendaciones}
            style={({ pressed }) => [
              styles.recommendButton,
              pressed &&
                styles.recommendButtonPressed,
            ]}
          >

            <Sparkles
              size={18}
              color={colors.white}
            />

            <Text style={styles.recommendButtonText}>
              Ver recomendaciones
            </Text>

          </Pressable>
        </View>

        {/*MODAL DE RECOMENDACIÓN*/}
        <Modal
          visible={showResults}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowResults(false)
          }
        >
          <View style={styles.modalOverlay}>

            <View style={styles.modalContainer}>

              {/* Botón cerrar */}
              <Pressable
                onPress={() =>
                  setShowResults(false)
                }
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <X
                  size={18}
                  color="#6B7280"
                />
              </Pressable>

              {/* Indicador */}
              <View style={styles.modalHandle} />

              {/*ENCABEZADO DEL RESULTADO*/}
              <View style={styles.resultHeader}>

                <View style={styles.sparkleContainer}>

                  <Sparkles
                    size={25}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.resultTitle}>
                  ¡Plan recomendado!
                </Text>

                <Text style={styles.resultSubtitle}>
                  Seleccionado para ti y tus filtros
                </Text>

              </View>

              {/*TARJETA DEL PLAN*/}
              <View style={styles.planCard}>

                <View style={styles.planHeader}>

                  <View style={styles.planInfo}>

                    <View style={styles.activityBadge}>

                      <Text style={styles.activityBadgeText}>
                        {selectedActivities.join(', ')}
                      </Text>

                    </View>

                    <Text style={styles.planTitle}>
                      Parque Ecológico Arví
                    </Text>

                  </View>

                  <View style={styles.ratingBadge}>

                    <Text style={styles.ratingText}>
                      4.8 ★
                    </Text>

                  </View>
                </View>

                {/*INFORMACIÓN*/}
                <View style={styles.planDetails}>

                  <View style={styles.detailRow}>

                    <MapPin
                      size={16}
                      color="#9CA3AF"
                    />

                    <Text style={styles.detailText}>
                      A 3.2 km de tu ubicación
                    </Text>

                  </View>

                  <View style={styles.detailRow}>

                    <DollarSign
                      size={16}
                      color="#9CA3AF"
                    />

                    <Text style={styles.detailText}>
                      Presupuesto: {selectedBudget}
                    </Text>

                  </View>

                  <View style={styles.detailRow}>
                    <Users size={16}color="#9CA3AF"/>
                    <Text style={styles.detailText}>Plan para: {selectedCompany}</Text>
                  </View>
                </View>
              </View>

              {/*BOTONES*/}
              <View style={styles.modalActions}>

                {/* Explorar */}
                <Pressable
                  onPress={() =>
                    setShowResults(false)
                  }
                  style={({ pressed }) => [
                    styles.exploreButton,
                    pressed &&
                      styles.recommendButtonPressed,
                  ]}
                >
                  <Text style={styles.exploreButtonText}>Explorar este plan</Text>
                </Pressable>

                {/* Probar nuevamente */}
                <Pressable
                  onPress={() =>
                    setShowResults(false)
                  }
                  style={({ pressed }) => [
                    styles.tryAgainButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <RefreshCw size={15} color="#4B5563"/>
                  <Text style={styles.tryAgainText}>Probar con otras opciones</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
  );
}

/*----------ESTILOS------------*/
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 50,
    marginBottom: 50,
  },

  /*BARRA DE ESTADO*/
  statusBar: {
    height: 34,
    paddingHorizontal: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusTime: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '600',
  },

  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  /*HEADER*/
  header: {
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonPressed: {
    backgroundColor: '#E5E7EB',
    transform: [{ scale: 0.95 }],
  },

  headerTitle: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '700',
  },

  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },

  /*FORMULARIO*/

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
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  /*ACTIVIDADES*/
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

  /*PRESUPUESTO*/
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

  /*BOTONES SELECCIONADOS*/
  selectedButton: {
    backgroundColor: colors.primary,
    elevation: 3,

    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  unselectedButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  selectedButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  unselectedButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },

  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },

  /*DISTANCIA*/
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  distanceBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  distanceText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },

  sliderContainer: {
    paddingHorizontal: 4,
    paddingTop: 2,
  },

  slider: {
    width: '100%',
    height: 40,
  },

  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },

  sliderLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
  },

  /*COMPAÑÍA*/
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

  /*BOTÓN INFERIOR*/
  bottomAction: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',

    elevation: 6,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  recommendButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    elevation: 4,

    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },

  recommendButtonPressed: {
    backgroundColor: '#048A58',
    transform: [{ scale: 0.98 }],
  },

  recommendButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  /*MODAL*/
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    backgroundColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  /*ENCABEZADO RESULTADO*/
  resultHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },

  sparkleContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  resultTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },

  resultSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },

  /*TARJETA DEL PLAN*/
  planCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    backgroundColor: '#ECFDF5',
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
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },

  ratingBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  ratingText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },

  /*DETALLES DEL PLAN*/
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
    color: '#4B5563',
    fontSize: 12,
  },

  /*ACCIONES MODAL*/
  modalActions: {
    marginTop: 18,
    gap: 9,
  },

  exploreButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',

    elevation: 3,

    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
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
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  tryAgainText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },

});