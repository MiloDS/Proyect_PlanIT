import { View, Text, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Search, Calendar, Heart, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MainTabParamList } from "../types/navigation";
import { colors } from '../styles/colors';
import { Button } from './Button';

const TAB_ICONS: Record<keyof MainTabParamList, typeof Home> = {
    Home,
    Search,
    Plans: Calendar,
    Favorites: Heart,
    Profile: User,
};

type TabBarModeProps = BottomTabBarProps & {
    activeTab?: never;
    onTabPress?: never;
};

type StandaloneModeProps = {
    state?: undefined;
    descriptors?: undefined;
    activeTab?: keyof MainTabParamList;
    navigation?: any;
    onTabPress?: (tab: keyof MainTabParamList) => void;
};

export type BottomNavBarProps = TabBarModeProps | StandaloneModeProps;

const DEFAULT_TABS: { name: keyof MainTabParamList; label: string }[] = [
    { name: 'Home', label: 'Inicio' },
    { name: 'Search', label: 'Buscar' },
    { name: 'Plans', label: 'Planes' },
    { name: 'Favorites', label: 'Favoritos' },
    { name: 'Profile', label: 'Perfil' },
];

export function BottomNavBar(props: BottomNavBarProps) {
    const insets = useSafeAreaInsets();
    const bottomPadding = Math.max(insets.bottom, 10);

    // If rendered by Tab.Navigator
    if (props.state && props.descriptors && props.navigation) {
        const { state, descriptors, navigation } = props;
        return (
            <View style={[styles.bottomNavigation, { paddingBottom: bottomPadding, height: 56 + bottomPadding }]}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        (options.tabBarLabel as string) ?? options.title ?? route.name;
                    const isFocused = state.index === index;
                    const Icon = TAB_ICONS[route.name as keyof MainTabParamList];

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <Button key={route.key} onPress={onPress} style={styles.navButton}>
                            <Icon size={21} color={isFocused ? colors.primary : "#94A3B8"} />
                            <Text
                                style={[
                                    styles.navText,
                                    isFocused ? styles.navTextActive : styles.navTextInactive,
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

    // Standalone usage (inside PlansScreen or any Stack Screen)
    const currentTab = props.activeTab ?? 'Plans';
    const nav = props.navigation;

    const handlePress = (tabName: keyof MainTabParamList) => {
        if (props.onTabPress) {
            props.onTabPress(tabName);
            return;
        }

        if (!nav) return;
        if (currentTab === tabName) return;

        try {
            nav.navigate('MainTabs', { screen: tabName });
        } catch {
            nav.navigate(tabName);
        }
    };

    return (
        <View style={[styles.bottomNavigation, { paddingBottom: bottomPadding, height: 56 + bottomPadding }]}>
            {DEFAULT_TABS.map((tab) => {
                const isFocused = currentTab === tab.name;
                const Icon = TAB_ICONS[tab.name];

                return (
                    <Button key={tab.name} onPress={() => handlePress(tab.name)} style={styles.navButton}>
                        <Icon size={21} color={isFocused ? colors.primary : "#94A3B8"} />
                        <Text
                            style={[
                                styles.navText,
                                isFocused ? styles.navTextActive : styles.navTextInactive,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </Button>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bottomNavigation: {
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingTop: 8,
        elevation: 8,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    navButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 5,
    },
    navText: {
        fontSize: 10,
        marginTop: 4,
    },
    navTextActive: {
        color: colors.primary,
        fontWeight: "700",
    },
    navTextInactive: {
        color: "#94A3B8",
        fontWeight: "500",
    },
});