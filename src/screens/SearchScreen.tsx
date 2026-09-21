import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { TabName } from '../types/components';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { TAB_TO_ROUTE } from '../utils/navigation';

type Props = NativeStackScreenProps<AppStackParamList, "Search">;

export function SearchScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('Buscar');

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    navigation.navigate(TAB_TO_ROUTE[tab]);
  };

  return <PlaceholderScreen title="Buscar" activeTab={activeTab} onTabPress={handleTabPress} />;
}