import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { TabName } from '../types/components';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { TAB_TO_ROUTE } from '../utils/navigation';

type Props = NativeStackScreenProps<AppStackParamList, "Plans">;

export function PlansScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('Planes');

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    navigation.navigate(TAB_TO_ROUTE[tab]);
  };

  return <PlaceholderScreen title="Planes" activeTab={activeTab} onTabPress={handleTabPress} />;
}