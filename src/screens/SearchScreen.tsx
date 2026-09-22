import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { PlaceholderScreen } from '../components/PlaceholderScreen';

type Props = BottomTabScreenProps<MainTabParamList, "Search">;

export function SearchScreen({ navigation }: Props) {
  return <PlaceholderScreen title="Buscar" />;
}