import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native'
import{ NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppStackParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { IntroScreen } from '../screens/IntroScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { hasSeenOnboarding, getUserSession } from '../utils/storage';

const Stack = createNativeStackNavigator<AppStackParamList>();

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
      setInitialRoute(session ? 'Home' : 'Login')
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
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}