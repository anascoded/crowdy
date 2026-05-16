import useAuthStore from "@/store/authStore";
import useFavoritesStore from "@/store/favoritesStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image, Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {JSX} from "react";

/**
 * Represents the properties for a menu item component.
 *
 * @interface MenuItemProps
 *
 * @property {keyof typeof Ionicons.glyphMap} icon - The icon to be displayed for the menu item, selected from Ionicons' glyph map.
 * @property {string} label - The text label for the menu item.
 * @property {() => void} onPress - Callback function triggered when the menu item is pressed.
 * @property {boolean} [destructive] - Optional. Indicates whether the menu item has a destructive action (e.g., deleting or removing).
 * @property {string} [value] - Optional. A value associated with the menu item, such as an identifier or metadata.
 */
interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  value?: string;
}

/**
 * Represents a menu item component that can be used to display interactive options in a menu.
 *
 * @param {Object} props - The properties of the menu item component.
 * @param {string} props.icon - The name of the icon to be displayed in the menu item.
 * @param {string} props.label - The label text displayed alongside the icon.
 * @param {function} props.onPress - Callback function triggered when the menu item is pressed.
 * @param {boolean} [props.destructive=false] - Indicates whether the menu item represents a destructive action (e.g., delete). If true, applies a styling to visually emphasize its destructive nature.
 * @param {string | number} [props.value] - An optional value to be displayed on the right side of the menu item.
 * @returns {JSX.Element} A touchable menu item component with an icon, label, optional value, and optional destructive styling.
 */
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
            color={destructive ? "#DC2626" : "#814141"}
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
 * Renders the ProfileScreen component, which provides a user interface
 * for viewing and managing user profile details, preferences, and account settings.
 * The screen adapts based on the user's authentication status and displays
 * different content for authenticated and unauthenticated users.
 *
 * @return {JSX.Element} The rendered ProfileScreen component containing user
 * profile details, settings options, and legal information, or a prompt to sign
 * in if the user is not authenticated.
 */
export default function ProfileScreen(): JSX.Element {
  const { user, isAuthenticated, isLoading, signOut } = useAuthStore();
  const { favorites, clearFavorites } = useFavoritesStore();

  /**
   * A function that handles the sign-out process for a user.
   * It displays a confirmation alert asking the user whether they want to sign out.
   * If the user confirms, it clears user-specific data, such as favorites,
   * performs the sign-out operation, and redirects to the sign-in page.
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
   * Displays an alert dialog with information about the Crowdy application.
   *
   * This function triggers a pop-up alert titled "About Crowdy" that provides
   * a brief description of the app's functionality and its current version.
   */
  const showAbout = () => {
    router.push('/screens/about');
  };

  /**
   * Opens the specified URL in the default web browser or the appropriate application.
   *
   * @param {string} url - The URL to be opened. This should be a properly formatted and valid URL string.
   */
  const openLink = (url: string) => {
    Linking.openURL(url);
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
              onPress={() => router.push("/(auth)/sign-in")}
              activeOpacity={0.85}
          >
            <Text style={styles.signInButtonText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push("/(auth)/sign-up")}
              activeOpacity={0.85}
          >
            <Text style={styles.signUpButtonText}>Create account</Text>
          </TouchableOpacity>
        </View>
    );
  }

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
          {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {user?.displayName?.[0]?.toUpperCase() ??
                      user?.location?.[0]?.toUpperCase() ??
                      "?"}
                </Text>
              </View>
          )}
          <Text style={styles.displayName}>{user?.displayName ?? "User"}</Text>
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
            <Text style={styles.statValue}>
              {user?.createdAt ? new Date(user.createdAt).getFullYear() : "—"}
            </Text>
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
                onPress={() => router.push("/(tabs)/profile-settings/edit-profile")}
            />
            <View style={styles.menuDivider} />
            <MenuItem
                icon="notifications-outline"
                label="Notifications"
                onPress={() => router.push("/(tabs)/profile-settings/notifications")}
            />
            <View style={styles.menuDivider} />
            <MenuItem
                icon="lock-closed-outline"
                label="Change password"
                onPress={() => router.push("/(tabs)/profile-settings/change-password")}
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
                onPress={() => router.push("/(tabs)/profile-settings/appearance")}
            />
            <View style={styles.menuDivider} />
            <MenuItem
                icon="location-outline"
                label="Default location"
                onPress={() => router.push("/(tabs)/profile-settings/location")}
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
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
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
    color: "#F77A05",
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
    backgroundColor: "#6C63FF",
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
    borderColor: "#6C63FF",
  },
  signUpButtonText: {
    color: "#6C63FF",
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