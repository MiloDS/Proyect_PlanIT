import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native'
import{ NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { IntroScreen } from '../screens/IntroScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SurpriseMeScreen } from '../screens/SurpriseMeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { BottomNavBar } from '../components/BottomNavBar';
import { hasSeenOnboarding, getUserSession } from '../utils/storage';

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
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Favoritos' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof AppStackParamList | null>(null)
  
  useEffect(() => {
    async function resolveInitialRoute(){
      const seenOnBording = await hasSeenOnboarding();
      if (!seenOnBording) {
        setInitialRoute('Intro');
        return;
      }

      const session = await getUserSession();
      setInitialRoute(session ? 'MainTabs' : 'Login')
    }
    resolveInitialRoute();
  }, []);
  if (initialRoute == null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}} >
        <ActivityIndicator size="large" color= "#2ecc71"/>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Intro" screenOptions={{headerShown: false}}>
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SurpriseMe" component={SurpriseMeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}