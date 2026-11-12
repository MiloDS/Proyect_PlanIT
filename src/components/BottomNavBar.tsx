import { View, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Search, Calendar, Heart, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types/navigation';
import { useTheme } from '../services/ThemeContext';
import { Button } from './Button';

const TAB_ICONS: Record<keyof MainTabParamList, typeof Home> = {
  Home,
  Search,
  Plans: Calendar,
  Favorites: Heart,
  Profile: User,
};

export function BottomNavBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <View
      style={[
        styles.bottomNavigation,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomPadding,
          height: 56 + bottomPadding,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.tabBarLabel as string) ?? options.title ?? route.name;
        const isFocused = state.index === index;
        const Icon = TAB_ICONS[route.name as keyof MainTabParamList];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Button key={route.key} onPress={onPress} style={styles.navButton}>
            <Icon size={21} color={isFocused ? colors.primary : colors.textMuted} />
            <Text
              style={[
                styles.navText,
                { color: isFocused ? colors.primary : colors.textMuted },
                isFocused && styles.navTextActive,
              ]}
            >
              {label}
            </Text>
          </Button>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
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
    fontWeight: '500',
  },
  navTextActive: {
    fontWeight: '700',
  },
});
