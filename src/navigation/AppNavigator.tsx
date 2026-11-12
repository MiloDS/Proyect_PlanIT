import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SplashScreen from 'expo-splash-screen';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
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
import { useTheme } from '../services/ThemeContext';
import { useOpenPlanFromNotification, usePlanReminderSync } from '../services/usePlanReminders';
import { IntroScreen } from '../screens/IntroScreen';
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
  const { session: authSession, isLoading, isRecoveringPassword } = useAuth();
  // Mientras alguien crea una contraseña nueva ya hay sesión, pero sigue en las pantallas
  // de acceso; entra a la app cuando la guarda
  const session = isRecoveringPassword ? null : authSession;
  const { isDark, colors: themeColors } = useTheme();
  const [navigationReady, setNavigationReady] = useState(false);
  const userId = session?.user.id ?? null;

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: themeColors.primary,
      background: themeColors.background,
      card: themeColors.card,
      text: themeColors.textPrimary,
      border: themeColors.border,
    },
  };

  // La Intro sale solo la primera vez: IntroScreen guarda la marca en el teléfono al terminar
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenOnboarding()
      .then(setSeenOnboarding)
      // Si el almacenamiento falla, se muestra la Intro en vez de dejar la pantalla de carga
      .catch(() => setSeenOnboarding(false));
  }, []);

  usePlanReminderSync(isLoading ? undefined : userId);
  useOpenPlanFromNotification(navigationRef, isLoading ? undefined : userId, navigationReady);

  const appReady = !isLoading && seenOnboarding !== null;

  // La pantalla de carga nativa (App.tsx) sigue visible hasta saber qué mostrar: Intro,
  // Login o la app. Este efecto corre cuando esa pantalla ya está dibujada.
  useEffect(() => {
    if (appReady) SplashScreen.hide();
  }, [appReady]);

  // Quien ya inició sesión pasó por el onboarding: al cerrar sesión debe ver Login, no Intro
  if (session && seenOnboarding === false) {
    setSeenOnboarding(true);
  }

  if (!appReady) {
    // Queda detrás de la pantalla de carga; con sus mismos colores por si se ve un instante
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.primary,
        }}
      >
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  // Las pantallas dependen de la sesión: al iniciar o cerrar sesión
  // React Navigation cambia de grupo sin necesidad de navigation.reset
  return (
    <ProfileProvider userId={userId}>
      <FavoritesProvider userId={userId}>
        <NavigationContainer
          ref={navigationRef}
          theme={navigationTheme}
          onReady={() => setNavigationReady(true)}
        >
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
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </FavoritesProvider>
    </ProfileProvider>
  );
}
