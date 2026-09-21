import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Home, Search, Calendar, Heart, User } from 'lucide-react-native';
import { BottomNavBarProps, TabName } from '../types/components';

const TABS: { name: TabName; Icon: typeof Home }[] = [
  { name: 'Inicio', Icon: Home },
  { name: 'Buscar', Icon: Search },
  { name: 'Planes', Icon: Calendar },
  { name: 'Favoritos', Icon: Heart },
  { name: 'Perfil', Icon: User },
];

export function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  return (
    <View style={styles.bottomNavigation}>
      {TABS.map(({ name, Icon }) => {
        const isActive = activeTab === name;
        return (
          <Pressable key={name} onPress={() => onTabPress(name)} style={styles.navButton}>
            <Icon size={21} color={isActive ? '#05A86B' : '#94A3B8'} />
            <Text style={[styles.navText, isActive ? styles.navTextActive : styles.navTextInactive]}>
              {name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
  },
  navTextActive: {
    color: '#05A86B',
    fontWeight: '700',
  },
  navTextInactive: {
    color: '#94A3B8',
    fontWeight: '500',
  },
});