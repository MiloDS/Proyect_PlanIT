import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { IntroScreen } from '../screens/IntroScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SurpriseMeScreen } from '../screens/SurpriseMeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { PlaceDetailScreen } from '../screens/PlaceDetailScreen';
import { CreatePlanScreen } from '../screens/CreatePlanScreen';
import { PlanDetailScreen } from '../screens/PlanDetailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { RecommendationsScreen } from '../screens/RecommendationsScreen';
import { BottomNavBar } from '../components/BottomNavBar';
import { useAuth } from '../services/AuthContext';
import { FavoritesProvider } from '../services/FavoritesContext';
import { ProfileProvider } from '../services/ProfileContext';
import { useOpenPlanFromNotification, usePlanReminderSync } from '../services/usePlanReminders';
import { hasSeenOnboarding } from '../utils/storage';
import { colors } from '../styles/colors';

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNavBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Buscar' }} />
      <Tab.Screen name="Plans" component={PlansScreen} options={{ tabBarLabel: 'Planes' }} />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Favoritos' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const navigationRef = createNavigationContainerRef<AppStackParamList>();

export function AppNavigator() {
  const { session, isLoading } = useAuth();
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);
  const [navigationReady, setNavigationReady] = useState(false);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    hasSeenOnboarding().then(setSeenOnboarding);
  }, []);

  usePlanReminderSync(isLoading ? undefined : userId);
  useOpenPlanFromNotification(navigationRef, isLoading ? undefined : userId, navigationReady);

  // Quien ya inició sesión pasó por el onboarding: al cerrar sesión debe ver Login, no Intro
  if (session && seenOnboarding === false) {
    setSeenOnboarding(true);
  }

  if (isLoading || seenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Las pantallas dependen de la sesión: al iniciar o cerrar sesión
  // React Navigation cambia de grupo sin necesidad de navigation.reset
  return (
    <ProfileProvider userId={userId}>
      <FavoritesProvider userId={userId}>
        <NavigationContainer ref={navigationRef} onReady={() => setNavigationReady(true)}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session ? (
              <>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="SurpriseMe" component={SurpriseMeScreen} />
                <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
                <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
                <Stack.Screen name="CreatePlan" component={CreatePlanScreen} />
                <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Help" component={HelpScreen} />
              </>
            ) : (
              <>
                {!seenOnboarding && <Stack.Screen name="Intro" component={IntroScreen} />}
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </FavoritesProvider>
    </ProfileProvider>
  );
}
