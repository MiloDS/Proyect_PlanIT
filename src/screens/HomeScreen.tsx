import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
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
import { getFirstName } from '../utils/user';
import { NEARBY_PLACES } from '../utils/mockData';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<AppStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
            accessibilityLabel="Cambiar ubicación: Medellín, Colombia"
          >
            <MapPin size={16} color={colors.textPrimary} />
            <Text style={styles.locationText}>Medellín, Colombia</Text>
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
            <Text style={styles.weatherMinMax}>Máx. 27°   Mín. 18°</Text>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placesRow}>
          {NEARBY_PLACES.map((place) => (
            <PlaceCard key={place.name} {...place} />
          ))}
        </ScrollView>
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
});