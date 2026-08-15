// app/(tabs)/_layout.web.tsx
import { Slot, usePathname, Link } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

const NAV_ITEMS = [
    { href: "/home", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/favorites", label: "Favorites" },
    { href: "/events", label: "Events" },
    { href: "/profile-settings", label: "Profile" },
];

export default function WebTabsLayout() {
    const pathname = usePathname();

    return (
        <View style={styles.container}>
            <View style={styles.sidebar}>
                <Text style={styles.logo}>Crowdy</Text>
                {NAV_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href as any} style={styles.navLink}>
                        <Text
                            style={[
                                styles.navText,
                                pathname === item.href && styles.navTextActive,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </Link>
                ))}
            </View>
            <View style={styles.content}>
                <Slot />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: "row", flex: 1, minHeight: "100vh" as any },
    sidebar: {
        width: 220,
        borderRightWidth: 1,
        borderRightColor: "#E5E7EB",
        padding: 24,
        gap: 4,
    },
    logo: { fontSize: 20, fontWeight: "700", marginBottom: 24, color: "#1A1A2E" },
    navLink: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
    navText: { fontSize: 15, color: "#6B7280" },
    navTextActive: { color: "#1A1A2E", fontWeight: "600" },
    content: { flex: 1, maxWidth: 1200, alignSelf: "center", width: "100%" },
});