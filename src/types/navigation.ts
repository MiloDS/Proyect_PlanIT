import { NavigatorScreenParams } from '@react-navigation/native';

import { Place, RecommendationPreferences } from './places';

export type AppStackParamList = {
  Intro: undefined;
  Login: { registeredEmail?: string } | undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SurpriseMe: undefined;
  PlaceDetail: { place: Place };
  Recommendations: { preferences: RecommendationPreferences };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Plans: undefined;
  Favorites: undefined;
  Profile: undefined;
};
