import { MainTabParamList } from '../types/navigation';
 
export const TAB_TO_ROUTE: Record<string, keyof MainTabParamList> = {
  Inicio: 'Home',
  Buscar: 'Search',
  Planes: 'Plans',
  Favoritos: 'Favorites',
  Perfil: 'Profile',
};