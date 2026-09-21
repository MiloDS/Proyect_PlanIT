import { AppStackParamList } from '../types/navigation';
import { TabName } from '../types/components';
 
export const TAB_TO_ROUTE: Record<TabName, keyof AppStackParamList> = {
  Inicio: 'Home',
  Buscar: 'Search',
  Planes: 'Plans',
  Favoritos: 'Favorites',
  Perfil: 'Profile',
};