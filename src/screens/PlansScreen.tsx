import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { PlaceholderScreen } from '../components/PlaceholderScreen';

type Props = BottomTabScreenProps<MainTabParamList, "Plans">;

export function PlansScreen({ navigation }: Props) {
  return <PlaceholderScreen title="Planes" />;
}