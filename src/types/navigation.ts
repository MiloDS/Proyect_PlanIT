import { NavigatorScreenParams } from '@react-navigation/native';

import { Place, RecommendationPreferences } from './places';
import { Plan } from './plans';

export type AppStackParamList = {
  Intro: undefined;
  Login: { registeredEmail?: string } | undefined;
  Register: undefined;
  /** `email`: el que la persona ya había escrito en Login */
  ForgotPassword: { email?: string } | undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SurpriseMe: undefined;
  PlaceDetail: { place: Place };
  Recommendations: { preferences: RecommendationPreferences };
  /** Con `plan`, la pantalla edita ese plan en lugar de crear uno nuevo */
  CreatePlan: { plan?: Plan } | undefined;
  PlanDetail: { plan: Plan };
  EditProfile: undefined;
  Notifications: undefined;
  Help: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Plans: undefined;
  Favorites: undefined;
  Profile: undefined;
};
