import { router } from "expo-router";
import {useState, version} from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationsScreen() {
    const [crowdAlerts, setCrowdAlerts] = useState(true);
    const [favoriteUpdates, setFavoriteUpdates] = useState(true);
    const [appUpdates, setAppUpdates] = useState(false);

    const NotificationToggle = ({
                                    label,
                                    value,
                                    onToggle,
                                }: {
        label: string;
        value: boolean;
        onToggle: (val: boolean) => void;
    }) => (
        <View style={styles.notificationItem}>
            <Text style={styles.notificationLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: "#E5E7EB", true: "#EADDCA" }}
                thumbColor={value ? "#5C4033" : "#9CA3AF"}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Alerts</Text>
                    <View style={styles.card}>
                        <NotificationToggle
                            label="Crowd alerts"
                            value={crowdAlerts}
                            onToggle={setCrowdAlerts}
                        />
                        <View style={styles.divider} />
                        <NotificationToggle
                            label="Favorite place updates"
                            value={favoriteUpdates}
                            onToggle={setFavoriteUpdates}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Updates</Text>
                    <View style={styles.card}>
                        <NotificationToggle
                            label="App updates"
                            value={appUpdates}
                            onToggle={setAppUpdates}
                        />
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={styles.version}>  Current version: {version}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F2EE",
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
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A2E",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#9CA3AF",
        textTransform: "uppercase",
        marginBottom: 12,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    notificationItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    notificationLabel: {
        fontSize: 15,
        color: "#1A1A2E",
        fontWeight: "500",
    },
    divider: {
        height: 0.5,
        backgroundColor: "#E5E7EB",
    },
    version: {
        fontSize: 10,
        fontWeight: "600",
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
});