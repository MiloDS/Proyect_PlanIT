import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ImageBackground, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { Button } from '../components/Button';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Plans'>,
  NativeStackScreenProps<AppStackParamList>
>;

interface PlanItem {
  id: string;
  title: string;
  date: string;
  placesCount: number;
  imageUrl: string;
  avatars: string[];
}

const upcomingPlans: PlanItem[] = [
  {
    id: '1',
    title: 'Tarde con amigos',
    date: '25 may 2025',
    placesCount: 4,
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    avatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    ],
  },
  {
    id: '2',
    title: 'Dia de museo',
    date: '15 jun 2025',
    placesCount: 3,
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?q=80&w=800&auto=format&fit=crop',
    avatars: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    ],
  },
  {
    id: '3',
    title: 'Aventura en la montaña',
    date: '28 jun 2025',
    placesCount: 5,
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
    avatars: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
    ],
  },
];

const pastPlans: PlanItem[] = [
  {
    id: '4',
    title: 'Ruta gastronómica',
    date: '12 abr 2025',
    placesCount: 3,
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop',
    avatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    ],
  },
];

export function PlansScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const currentPlans = activeTab === 'upcoming' ? upcomingPlans : pastPlans;

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Mis planes</Text>

        <View style={styles.segmentContainer}>
          <Pressable
            style={[styles.segmentButton, activeTab === 'upcoming' && styles.segmentButtonActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text
              style={[styles.segmentText, activeTab === 'upcoming' && styles.segmentTextActive]}
            >
              Próximos
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentButton, activeTab === 'past' && styles.segmentButtonActive]}
            onPress={() => setActiveTab('past')}
          >
            <Text
              style={[styles.segmentText, activeTab === 'past' && styles.segmentTextActive]}
            >
              Pasados
            </Text>
          </Pressable>
        </View>

        <View style={styles.cardsList}>
          {currentPlans.map((plan) => (
            <Pressable
              key={plan.id}
              style={({ pressed }) => [styles.cardContainer, pressed && { opacity: 0.95 }]}
            >
              <ImageBackground
                source={{ uri: plan.imageUrl }}
                style={styles.cardBackground}
                imageStyle={styles.cardImage}
              >
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardTitle}>{plan.title}</Text>
                  <Text style={styles.cardSubtitle}>
                    {plan.date} • {plan.placesCount} lugares
                  </Text>

                  <View style={styles.avatarRow}>
                    {plan.avatars.map((avatarUri, index) => (
                      <Image
                        key={index}
                        source={{ uri: avatarUri }}
                        style={[styles.avatar, { zIndex: plan.avatars.length - index }]}
                      />
                    ))}
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.fabContainer}>
        <Button variant="primary" style={styles.fabButton} onPress={() => {}}>
          <Plus size={18} color={colors.white} strokeWidth={2.5} style={styles.fabIcon} />
          <Text style={styles.fabText}>Nuevo plan</Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 96,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 18,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  cardsList: {
    gap: 16,
  },
  cardContainer: {
    height: 142,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardBackground: {
    flex: 1,
  },
  cardImage: {
    borderRadius: 18,
  },
  cardOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textBody,
    marginTop: 4,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.white,
    marginRight: 6,
  },
  fabContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 16,
  },
  fabButton: {
    flexDirection: 'row',
    borderRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  fabIcon: {
    marginRight: 6,
  },
  fabText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});