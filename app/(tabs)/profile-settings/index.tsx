import { useAuthStore } from "@/store/authStore";
import useFavoritesStore from "@/store/favoritesStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"; // Removed unused 'Image' import to resolve TS6133
import { JSX } from "react";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  value?: string;
}

const MenuItem = ({
                    icon,
                    label,
                    onPress,
                    destructive,
                    value,
                  }: MenuItemProps): JSX.Element => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
    >
      <View
          style={[
            styles.menuIconContainer,
            destructive && styles.menuIconDestructive,
          ]}
      >
        <Ionicons
            name={icon}
            size={18}
            color={destructive ? "#E7180B" : "#4A0404"}
        />
      </View>
      <Text
          style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}
      >
        {label}
      </Text>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {!destructive && (
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
);

/**
 * Renders the ProfileScreen component.
 * Syncs seamlessly with the provisioned Amplify Gen 2 custom UserProfile model configurations.
 */
export default function ProfileScreen(): JSX.Element {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuthStore();
  const { favorites, clearFavorites } = useFavoritesStore();

  /**
   * Handles the user sign-out process by displaying a confirmation alert.
   *
   * This function presents an alert dialog with two options: "Cancel" and "Sign out".
   * - If "Cancel" is chosen, the dialog is dismissed without taking further action.
   * - If "Sign out" is selected, the user's favorite data is cleared, the sign-out process
   *   is executed asynchronously, and the user is redirected to the sign-in screen.
   *
   * Note: The function makes use of asynchronous operations and performs a redirect
   * upon successful sign-out.
   */
  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          clearFavorites();
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  /**
   * Navigates the application to the "About" screen.
   *
   * This function triggers a route change to the "/screens/about" path,
   * allowing the user to view details or information presented on the "About" screen.
   *
   * Note: The route path is cast to "any" to suppress type errors in the routing implementation.
   */
  const showAbout = () => {
    router.push('/screens/about' as any);
  };

  /**
   * Asynchronously attempts to open a given URL using the device's default URL handler.
   *
   * If the device supports opening the URL, it will be opened. Otherwise, an alert will notify the user
   * that their device cannot open the specified type of URL. If an error occurs during the process,
   * an alert will notify the user of the issue and an error will be logged to the console.
   *
   * @param {string} url - The URL to be opened.
   * @throws Will log an error to the console if opening the URL fails unexpectedly.
   */
  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Invalid Link", `Your device cannot open this type of URL: ${url}`);
      }
    } catch (error) {
      console.error("An error occurred while opening the URL:", error);
      Alert.alert("Error", "Something went wrong trying to open this link.");
    }
  };

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
        <View style={styles.centeredContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#E5E7EB" />
          <Text style={styles.gateTitle}>Your profile</Text>
          <Text style={styles.gateSubtitle}>
            Sign in to manage your account and preferences.
          </Text>
          <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push("/(auth)/login" as any)}
              activeOpacity={0.85}
          >
            <Text style={styles.signInButtonText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push("/(auth)/register" as any)}
              activeOpacity={0.85}
          >
            <Text style={styles.signUpButtonText}>Create account</Text>
          </TouchableOpacity>
        </View>
    );
  }

  // Safe checks for metadata attributes using type-casting handles variant store profiles cleanly
  const userRecord = user as any;
  const userLocation: string | undefined = userRecord?.location;

  const memberSinceYear = userRecord?.createdAt
      ? new Date(userRecord.createdAt).getFullYear()
      : new Date().getFullYear();

  const memberSinceMonth = userRecord?.createdAt
      ? new Date(userRecord.createdAt).toLocaleString('default', { month: 'long' })
      : new Date().toLocaleString('default', { month: 'long' });

  // ── Authenticated ──────────────────────────────────────────────────────────
  return (
      <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar + user info */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {user?.name?.[0]?.toUpperCase() ??
                  userLocation?.[0]?.toUpperCase() ??
                  "?"}
            </Text>
          </View>
          <Text style={styles.displayName}>{user?.name ?? "User"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{memberSinceMonth} {memberSinceYear}</Text>
            <Text style={styles.statLabel}>Member since</Text>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
                icon="person-outline"
                label="Edit profile"
                onPress={() => router.push("/(tabs)/profile-settings/edit-profile" as any)}
            />
            <View style={styles.menuDivider} />
            <MenuItem
                icon="notifications-outline"
                label="Notifications"
                onPress={() => router.push("/(tabs)/profile-settings/notifications" as any)}
            />
            <View style={styles.menuDivider} />
            <MenuItem
                icon="lock-closed-outline"
                label="Change password"
                onPress={() => router.push("/(tabs)/profile-settings/change-password" as any)}
            />
          </View>
        </View>

        {/* Preferences section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <MenuItem
                icon="moon-outline"
                label="Appearance"
                value="System"
                onPress={() => router.push("/(tabs)/profile-settings/appearance" as any)}
            />
            <View style={styles.menuDivider} />
            <MenuItem
                icon="location-outline"
                label="Default location"
                onPress={() => router.push("/(tabs)/profile-settings/location" as any)}
            />
          </View>
        </View>

        {/* Legal section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.menuCard}>
            <MenuItem
                icon="document-text-outline"
                label="Terms of Service"
                onPress={() => openLink('https://www.crowdy.app/terms-of-serivce')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
                icon="shield-checkmark-outline"
                label="Privacy Policy"
                onPress={() => openLink('https://www.crowdy.app/privacy-policy')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
                icon="information-circle-outline"
                label="About"
                onPress={showAbout}
            />
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem
                icon="log-out-outline"
                label="Sign out"
                onPress={handleSignOut}
                destructive
            />
          </View>
        </View>

        {/* Loading overlay for sign-out */}
        {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#6C63FF" />
            </View>
        )}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingBottom: 48,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 60,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "#4A0404",
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 20,
    marginTop: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIconDestructive: {
    backgroundColor: "#FEF2F2",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A2E",
    fontWeight: "500",
  },
  menuLabelDestructive: {
    color: "#DC2626",
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  menuValue: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: "#E5E7EB",
    marginLeft: 60,
  },
  gateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    marginTop: 8,
  },
  gateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  signInButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#4A0404",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signUpButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#4A0404",
  },
  signUpButtonText: {
    color: "#4A0404",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});