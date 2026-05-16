import { router } from "expo-router";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Theme = "light" | "dark" | "system";

export default function AppearanceScreen() {
    const [theme, setTheme] = useState<Theme>("system");

    const themes: { label: string; value: Theme }[] = [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "System", value: "system" },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={styles.title}>Appearance</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Theme</Text>
                <View style={styles.themeCard}>
                    {themes.map((t) => (
                        <TouchableOpacity
                            key={t.value}
                            style={styles.themeOption}
                            onPress={() => setTheme(t.value)}
                        >
                            <View
                                style={[
                                    styles.radioButton,
                                    theme === t.value && styles.radioSelected,
                                ]}
                            >
                                {theme === t.value && (
                                    <View style={styles.radioDot} />
                                )}
                            </View>
                            <Text style={styles.themeLabel}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 60,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E7EB",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A1A2E",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#9CA3AF",
        textTransform: "uppercase",
        marginBottom: 12,
    },
    themeCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    themeOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E7EB",
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    radioSelected: {
        borderColor: "#6C63FF",
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#6C63FF",
    },
    themeLabel: {
        fontSize: 15,
        color: "#1A1A2E",
        fontWeight: "500",
    },
});