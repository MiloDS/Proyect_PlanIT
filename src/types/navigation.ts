import { NavigatorScreenParams } from '@react-navigation/native';

export type AppStackParamList = {
  Intro: undefined;
  Login: { registeredEmail?: string } | undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SurpriseMe: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Plans: undefined;
  Favorites: undefined;
  Profile: undefined;
};
