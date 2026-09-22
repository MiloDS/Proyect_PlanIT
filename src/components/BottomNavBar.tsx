import { View, Text, Pressable, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Search, Calendar, Heart, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MainTabParamList } from "../types/navigation";
import { colors } from '../styles/colors';

const TAB_ICONS: Record<keyof MainTabParamList, typeof Home> = {
    Home,
    Search,
    Plans: Calendar,
    Favorites: Heart,
    Profile: User,
};

export function BottomNavBar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const bottomPadding = Math.max(insets.bottom, 10);

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
                    <Pressable key={route.key} onPress={onPress} style={styles.navButton}>
                        <Icon size={21} color={isFocused ? colors.primary : "#94A3B8"} />
                        <Text
                            style={[
                                styles.navText,
                                isFocused ? styles.navTextActive : styles.navTextInactive,
                            ]}
                        >
                            {label}
                        </Text>
                    </Pressable>
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