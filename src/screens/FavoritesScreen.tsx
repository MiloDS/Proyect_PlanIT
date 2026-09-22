import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { PlaceholderScreen } from '../components/PlaceholderScreen';

type Props = BottomTabScreenProps<MainTabParamList, "Favorites">;

export function FavoritesScreen({ navigation }: Props) {
  return <PlaceholderScreen title="Favoritos" />;
}