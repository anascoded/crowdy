import { useAuthStore } from "@/store/authStore";
import useFavoritesStore from "@/store/favoritesStore";
import { placesService } from "@/services/placesService";
import { useRouter } from "expo-router";
import { updateUserAttributes, updatePassword } from "aws-amplify/auth";
import { Ionicons } from "@expo/vector-icons";
import { JSX, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Matches package.json ("crowdy@1.0.0"). Native notifications.tsx currently
// imports { version } from "react" by mistake, which is React's own version,
// not the app's — not replicated here.
const APP_VERSION = "1.0.0";

type SectionKey =
    | "overview"
    | "edit-profile"
    | "change-password"
    | "appearance"
    | "notifications"
    | "location";

interface CityPrediction {
    description: string;
    placeId: string;
}

interface ToastState {
    type: "success" | "error";
    message: string;
}

const NAV_SECTIONS: { key: SectionKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "overview", label: "Overview", icon: "person-circle-outline" },
    { key: "edit-profile", label: "Edit Profile", icon: "person-outline" },
    { key: "change-password", label: "Change Password", icon: "lock-closed-outline" },
    { key: "appearance", label: "Appearance", icon: "contrast-outline" },
    { key: "notifications", label: "Notifications", icon: "notifications-outline" },
    { key: "location", label: "Default Location", icon: "location-outline" },
];

/**
 * Desktop variant of the profile-settings stack. The native app splits this
 * into a Stack navigator with 6 routes (index + 5 sub-screens); on desktop
 * there's room to show everything as one page with a left-nav section
 * switcher instead of separate pushed routes. All the same store/service
 * calls as the native screens — only navigation and layout differ.
 */
export default function ProfileSettingsScreenWeb(): JSX.Element {
    const router = useRouter();
    const { user, isAuthenticated, signOut } = useAuthStore();
    const { favorites, clearFavorites } = useFavoritesStore();

    const [activeSection, setActiveSection] = useState<SectionKey>("overview");
    const [toast, setToast] = useState<ToastState | null>(null);

    // Alert.alert is a no-op on React Native Web — using an inline toast instead
    // so success/error feedback is actually visible in the browser.
    const showToast = (type: ToastState["type"], message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Edit profile ────────────────────────────────────────────────────────
    const [name, setName] = useState(user?.name || "");
    const [savingProfile, setSavingProfile] = useState(false);

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            showToast("error", "Name cannot be empty");
            return;
        }
        try {
            setSavingProfile(true);
            await updateUserAttributes({ userAttributes: { name: name.trim() } });
            showToast("success", "Profile updated!");
        } catch (err: any) {
            showToast("error", err.message || "Something went wrong updating your profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    // ── Change password ─────────────────────────────────────────────────────
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast("error", "All fields are required");
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("error", "New passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            showToast("error", "Password must be at least 8 characters");
            return;
        }
        try {
            setSavingPassword(true);
            await updatePassword({ oldPassword: currentPassword, newPassword });
            showToast("success", "Password updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            showToast("error", err.message || "An error occurred while updating your password.");
        } finally {
            setSavingPassword(false);
        }
    };

    // ── Appearance (native screen keeps this as local state only — no
    // persistence exists there either, so parity is intentional here) ────────
    const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

    // ── Notifications (same: local state only in the native screen too) ─────
    const [crowdAlerts, setCrowdAlerts] = useState(true);
    const [favoriteUpdates, setFavoriteUpdates] = useState(true);
    const [appUpdates, setAppUpdates] = useState(false);

    // ── Location ─────────────────────────────────────────────────────────────
    const [city, setCity] = useState("Boston, MA");
    const [citySuggestions, setCitySuggestions] = useState<CityPrediction[]>([]);
    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
        if (activeSection !== "location") return;
        if (city.length < 2) {
            setCitySuggestions([]);
            return;
        }
        const fetchSuggestions = async () => {
            try {
                setLocationLoading(true);
                const predictions = await placesService.autocomplete(city);
                const cities = (predictions as CityPrediction[]).filter((p) => {
                    const desc = p.description.toLowerCase();
                    return (
                        desc.includes("city") ||
                        desc.includes("town") ||
                        desc.includes("region") ||
                        desc.includes("administrative") ||
                        /^[^,]+,\s*[^,]+/.test(p.description)
                    );
                });
                setCitySuggestions(cities.slice(0, 5));
            } catch (error) {
                console.error("Error fetching cities:", error);
                setCitySuggestions([]);
            } finally {
                setLocationLoading(false);
            }
        };
        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [city, activeSection]);

    const handleSelectCity = (selected: string) => {
        setCity(selected);
        setCitySuggestions([]);
    };

    const handleSaveLocation = () => {
        // Native location.tsx's "Save Location" button has no handler — nothing
        // is persisted there today. Wiring this to AsyncStorage for parity with
        // how the app already persists other client-only prefs (favorites,
        // activity log). Flag this gap in the native screen separately.
        AsyncStorage.setItem("crowdy_default_location", city)
            .then(() => showToast("success", "Default location saved"))
            .catch(() => showToast("error", "Failed to save location"));
    };

    // ── Sign out ─────────────────────────────────────────────────────────────
    const handleSignOut = () => {
        // window.confirm replaces Alert.alert's confirmation dialog, which does
        // not render on web.
        if (typeof window !== "undefined" && !window.confirm("Are you sure you want to sign out?")) {
            return;
        }
        clearFavorites();
        signOut().then(() => router.replace("/(auth)/sign-in"));
    };

    const openLink = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) await Linking.openURL(url);
        } catch (error) {
            console.error("Failed to open link:", error);
        }
    };

    if (!isAuthenticated) {
        return (
            <View style={styles.gateContainer}>
                <Ionicons name="person-circle-outline" size={80} color="#E5E7EB" />
                <Text style={styles.gateTitle}>Your profile</Text>
                <Text style={styles.gateSubtitle}>Sign in to manage your account and preferences.</Text>
                <TouchableOpacity style={styles.gateButton} onPress={() => router.push("/(auth)/sign-in" as any)}>
                    <Text style={styles.gateButtonText}>Sign in</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const userRecord = user as any;

    const memberSinceYear = userRecord?.createdAt ? new Date(userRecord.createdAt).getFullYear() : new Date().getFullYear();
    const memberSinceMonth = userRecord?.createdAt
        ? new Date(userRecord.createdAt).toLocaleString("default", { month: "long" })
        : new Date().toLocaleString("default", { month: "long" });

    return (
        <View style={styles.page}>
            {/* Left nav */}
            <View style={styles.sidebar}>
                <View style={styles.avatarBlock}>
                    <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? "?"}</Text>
                    </View>
                    <Text style={styles.displayName}>{user?.name ?? "User"}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                </View>

                {NAV_SECTIONS.map((section) => (
                    <TouchableOpacity
                        key={section.key}
                        style={[styles.navItem, activeSection === section.key && styles.navItemActive]}
                        onPress={() => setActiveSection(section.key)}
                    >
                        <Ionicons
                            name={section.icon}
                            size={18}
                            color={activeSection === section.key ? "#1A1A2E" : "#9CA3AF"}
                        />
                        <Text style={[styles.navLabel, activeSection === section.key && styles.navLabelActive]}>
                            {section.label}
                        </Text>
                    </TouchableOpacity>
                ))}

                <View style={styles.sidebarDivider} />

                <TouchableOpacity style={styles.navItem} onPress={() => openLink("https://www.crowdy.app/terms-of-service")}>
                    <Ionicons name="document-text-outline" size={18} color="#9CA3AF" />
                    <Text style={styles.navLabel}>Terms of Service</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => openLink("https://www.crowdy.app/privacy-policy")}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#9CA3AF" />
                    <Text style={styles.navLabel}>Privacy Policy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.navItem, styles.signOutItem]} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                    <Text style={[styles.navLabel, styles.signOutLabel]}>Sign out</Text>
                </TouchableOpacity>
            </View>

            {/* Content panel */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                {toast && (
                    <View style={[styles.toast, toast.type === "error" ? styles.toastError : styles.toastSuccess]}>
                        <Text style={styles.toastText}>{toast.message}</Text>
                    </View>
                )}

                {activeSection === "overview" && (
                    <View>
                        <Text style={styles.panelTitle}>Overview</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{favorites.length}</Text>
                                <Text style={styles.statLabel}>Favorites</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {memberSinceMonth} {memberSinceYear}
                                </Text>
                                <Text style={styles.statLabel}>Member since</Text>
                            </View>
                        </View>
                    </View>
                )}

                {activeSection === "edit-profile" && (
                    <View>
                        <Text style={styles.panelTitle}>Edit Profile</Text>
                        <View style={styles.field}>
                            <Text style={styles.label}>Display Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                editable={!savingProfile}
                                placeholder="Enter your name"
                            />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Email</Text>
                            <View style={[styles.input, styles.disabledInput]}>
                                <Text style={styles.disabledText}>{user?.email}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.primaryButton, savingProfile && styles.buttonDisabled]}
                            onPress={handleSaveProfile}
                            disabled={savingProfile}
                        >
                            <Text style={styles.primaryButtonText}>{savingProfile ? "Saving..." : "Save Changes"}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeSection === "change-password" && (
                    <View>
                        <Text style={styles.panelTitle}>Change Password</Text>
                        <PasswordField
                            label="Current Password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            show={showCurrent}
                            onToggleShow={() => setShowCurrent((v) => !v)}
                            disabled={savingPassword}
                        />
                        <PasswordField
                            label="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            show={showNew}
                            onToggleShow={() => setShowNew((v) => !v)}
                            disabled={savingPassword}
                        />
                        <PasswordField
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            show={showConfirm}
                            onToggleShow={() => setShowConfirm((v) => !v)}
                            disabled={savingPassword}
                        />
                        <TouchableOpacity
                            style={[styles.primaryButton, savingPassword && styles.buttonDisabled]}
                            onPress={handleChangePassword}
                            disabled={savingPassword}
                        >
                            <Text style={styles.primaryButtonText}>{savingPassword ? "Updating..." : "Change Password"}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeSection === "appearance" && (
                    <View>
                        <Text style={styles.panelTitle}>Appearance</Text>
                        <Text style={styles.sectionLabel}>Theme</Text>
                        <View style={styles.card}>
                            {(["light", "dark", "system"] as const).map((t) => (
                                <TouchableOpacity key={t} style={styles.radioRow} onPress={() => setTheme(t)}>
                                    <View style={[styles.radioOuter, theme === t && styles.radioOuterSelected]}>
                                        {theme === t && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={styles.radioLabel}>{t[0].toUpperCase() + t.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {activeSection === "notifications" && (
                    <View>
                        <Text style={styles.panelTitle}>Notifications</Text>
                        <Text style={styles.sectionLabel}>Alerts</Text>
                        <View style={styles.card}>
                            <ToggleRow label="Crowd alerts" value={crowdAlerts} onToggle={setCrowdAlerts} />
                            <View style={styles.divider} />
                            <ToggleRow label="Favorite place updates" value={favoriteUpdates} onToggle={setFavoriteUpdates} />
                        </View>
                        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Updates</Text>
                        <View style={styles.card}>
                            <ToggleRow label="App updates" value={appUpdates} onToggle={setAppUpdates} />
                        </View>
                        <Text style={styles.versionText}>Current version: {APP_VERSION}</Text>
                    </View>
                )}

                {activeSection === "location" && (
                    <View>
                        <Text style={styles.panelTitle}>Default Location</Text>
                        <View style={styles.field}>
                            <Text style={styles.label}>City/Region</Text>
                            <TextInput
                                style={styles.input}
                                value={city}
                                onChangeText={setCity}
                                placeholder="Enter your default location"
                            />
                            {citySuggestions.length > 0 && (
                                <View style={styles.suggestions}>
                                    {locationLoading && (
                                        <View style={styles.suggestionsLoading}>
                                            <ActivityIndicator size="small" color="#6C63FF" />
                                        </View>
                                    )}
                                    {citySuggestions.map((s) => (
                                        <TouchableOpacity
                                            key={s.placeId}
                                            style={styles.suggestionItem}
                                            onPress={() => handleSelectCity(s.description)}
                                        >
                                            <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                                            <Text style={styles.suggestionText}>{s.description}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            <Text style={styles.hint}>This location is used to show nearby places when you open the app.</Text>
                        </View>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveLocation}>
                            <Text style={styles.primaryButtonText}>Save Location</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function PasswordField({
                           label,
                           value,
                           onChangeText,
                           show,
                           onToggleShow,
                           disabled,
                       }: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    show: boolean;
    onToggleShow: () => void;
    disabled: boolean;
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.passwordRow}>
                <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!show}
                    value={value}
                    onChangeText={onChangeText}
                    editable={!disabled}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="••••••••"
                />
                <TouchableOpacity onPress={onToggleShow} disabled={disabled}>
                    <Ionicons name={show ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
    return (
        <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: "#E5E7EB", true: "#9CA3AF" }}
                thumbColor={value ? "#0A0A0A" : "#9CA3AF"}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    gateContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        gap: 12,
    },
    gateTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
    gateSubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
    gateButton: {
        backgroundColor: "#FDCD5D",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 32,
        marginTop: 8,
    },
    gateButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

    page: { flexDirection: "row", flex: 1, minHeight: "100vh" as any, backgroundColor: "#F9FAFB" },

    sidebar: {
        width: 260,
        borderRightWidth: 1,
        borderRightColor: "#E5E7EB",
        backgroundColor: "#fff",
        padding: 20,
        gap: 4,
    },
    avatarBlock: { alignItems: "center", paddingVertical: 20, marginBottom: 8 },
    avatarFallback: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#EDE9FE",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    avatarInitial: { fontSize: 26, fontWeight: "700", color: "#FAD341" },
    displayName: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
    email: { fontSize: 12, color: "#6B7280", marginTop: 2 },

    navItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    navItemActive: { backgroundColor: "#F3F4F6" },
    navLabel: { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },
    navLabelActive: { color: "#1A1A2E", fontWeight: "600" },
    sidebarDivider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 12 },
    signOutItem: { marginTop: 4 },
    signOutLabel: { color: "#DC2626" },

    content: { flex: 1 },
    contentInner: { padding: 40, maxWidth: 560 },

    toast: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 20 },
    toastSuccess: { backgroundColor: "#D1FAE5" },
    toastError: { backgroundColor: "#FEE2E2" },
    toastText: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },

    panelTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A2E", marginBottom: 20 },

    statsRow: { flexDirection: "row", gap: 16 },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 20,
        alignItems: "center",
    },
    statValue: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
    statLabel: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },

    field: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: "#1A1A2E",
    },
    disabledInput: { justifyContent: "center", backgroundColor: "#F9FAFB" },
    disabledText: { color: "#9CA3AF" },

    primaryButton: {
        backgroundColor: "#0A0A0A",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 12,
        alignSelf: "flex-start",
        paddingHorizontal: 32,
    },
    primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    buttonDisabled: { opacity: 0.6 },

    passwordRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    passwordInput: { flex: 1, fontSize: 15, color: "#1A1A2E" },

    sectionLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#9CA3AF",
        textTransform: "uppercase",
        marginBottom: 10,
    },
    card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden" },
    divider: { height: 1, backgroundColor: "#E5E7EB" },

    radioRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    radioOuterSelected: { borderColor: "#FDCD5D" },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#0A0A0A" },
    radioLabel: { fontSize: 15, color: "#1A1A2E", fontWeight: "500" },

    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    toggleLabel: { fontSize: 15, color: "#1A1A2E", fontWeight: "500" },
    versionText: { fontSize: 11, fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", marginTop: 16 },

    suggestions: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, marginTop: 8 },
    suggestionsLoading: { padding: 12, alignItems: "center" },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#F0F0F0",
        gap: 10,
    },
    suggestionText: { fontSize: 14, color: "#1A1A2E", flex: 1 },
    hint: { fontSize: 13, color: "#9CA3AF", marginTop: 8 },
});