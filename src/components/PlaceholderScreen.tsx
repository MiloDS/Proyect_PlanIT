import { View, Text, StyleSheet } from "react-native";
import { PlaceholderScreenProps } from "../types/components";
import { colors } from "../styles/colors";

export function PlaceholderScreen({
    title,
}: PlaceholderScreenProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>Próximamente</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1E293B",
    },
    subtitle: {
        fontSize: 13,
        color: "#94A3B8",
        marginTop: 6,
    },
});