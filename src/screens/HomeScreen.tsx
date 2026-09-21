import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { MapPin, ChevronDown, Bell, Cloud, Sparkles } from 'lucide-react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { PlaceCard } from '../components/PlaceCard';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<AppStackParamList>
>;

const nearbyPlaces = [
  {
    name: 'Parque Arví',
    category: 'Parque',
    distanceKm: 2.4,
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Museo de Antioquia',
    category: 'Museo',
    distanceKm: 3.1,
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Café Amor',
    category: 'Cafetería',
    distanceKm: 1.8,
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=400&auto=format&fit=crop',
  },
];

export function HomeScreen({ navigation }: Props) {


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.locationRow}>
            <MapPin size={16} color="#1E293B" />
            <Text style={styles.locationText}>Medellín, Colombia</Text>
            <ChevronDown size={16} color="#1E293B" />
          </Pressable>

          <Pressable>
            <Bell size={22} color="#1E293B" />
          </Pressable>
        </View>

        <Text style={styles.greeting}>¡Hola, Laura! 👋</Text>
        <Text style={styles.subGreeting}>¿Qué plan tienes hoy?</Text>

        <View style={styles.weatherCard}>
          <View>
            <Text style={styles.weatherTemp}>24°C</Text>
            <Text style={styles.weatherDescription}>Parcialmente nublado</Text>
            <Text style={styles.weatherMinMax}>Máx. 27°   Mín. 18°</Text>
          </View>
          <Cloud size={40} color="#FFFFFF" />
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

          <Pressable
            style={styles.surpriseButton}
            onPress={() => navigation.navigate('SurpriseMe')}
          >
            <Text style={styles.surpriseButtonText}>Sorpréndeme</Text>
            <Sparkles size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cerca de ti</Text>
          <Pressable>
            <Text style={styles.sectionLink}>Ver todo</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placesRow}>
          {nearbyPlaces.map((place) => (
            <PlaceCard key={place.name} {...place} />
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 50,
  },
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
    color: '#1E293B',
    marginHorizontal: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 20,
  },
  weatherCard: {
    backgroundColor: '#38BDF8',
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
    color: '#FFFFFF',
  },
  weatherDescription: {
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 2,
  },
  weatherMinMax: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  surpriseCard: {
    backgroundColor: '#F8FAFC',
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
    color: '#1E293B',
  },
  surpriseDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  surpriseButton: {
    backgroundColor: '#05A86B',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surpriseButtonText: {
    color: '#FFFFFF',
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
    color: '#1E293B',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#05A86B',
  },
  placesRow: {
    paddingRight: 24,
  },
});