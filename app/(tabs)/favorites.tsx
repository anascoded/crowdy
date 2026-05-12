import PlaceCard from "@/components/PlaceCard";
import useAuthStore from "@/store/authStore";
import useFavoritesStore from "@/store/favoritesStore";
import { Place } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {JSX, useEffect, useState} from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Represents the FavoritesScreen component, which displays the user's favorite places.
 * The component adjusts its behavior based on the authentication state and the data loading status.
 *
 * @return {JSX.Element} The rendered FavoritesScreen component, displaying
 * either the authentication prompt, a loading indicator, or the user's list of favorite places.
 * Includes functionality for refreshing the list, handling errors, and navigating to specific places or the explore screen.
 */
export default function FavoritesScreen(): JSX.Element {
  const { isAuthenticated } = useAuthStore();
  const {
    favorites,
    isLoading,
    isSyncing,
    error,
    fetchFavorites,
    removeFavorite,
  } = useFavoritesStore();

  const [refreshing, setRefreshing] = useState(false);

  // Fetch favorites when authenticated
  useEffect(() => {
    const fetch = async () => {
      if (isAuthenticated) {
        await fetchFavorites();
      }
    };
    fetch();
  }, [fetchFavorites, isAuthenticated]);

  /**
   * Handles the refresh action by updating the refreshing state,
   * fetching the latest favorites data, and then resetting the
   * refreshing state.
   *
   * This asynchronous function is typically used to trigger a
   * refresh operation for updating the data displayed in the
   * user interface.
   *
   * @function
   * @async
   * @returns {Promise<void>} A promise that resolves when the refresh operation is complete.
   */
  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  /**
   * Handles the event when a place is selected.
   *
   * This function navigates the user to the detailed page
   * of the specified place, using its unique identifier.
   *
   * @param {Place} place - The place object containing details
   *                        about the selected location. It must
   *                        include an `id` property.
   */
  const handlePlacePress = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

  /**
   * Handles the removal of a favorite item identified by its place ID.
   *
   * This asynchronous function calls the `removeFavorite` function to
   * remove the specified favorite entity. It is typically used to
   * manage the state of user favorited items in an application.
   *
   * @param {string} placeId - The unique identifier of the place to be removed from favorites.
   * @returns {Promise<void>} A promise that resolves when the removal operation completes.
   */
  const handleRemoveFavorite = async (placeId: string): Promise<void> => {
    await removeFavorite(placeId);
  };

  // ── Not authenticated ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="heart-outline" size={64} color="#E5E7EB" />
        <Text style={styles.gateTitle}>Save your favorite places</Text>
        <Text style={styles.gateSubtitle}>
          Sign in to keep track of places you love and check their crowd levels
          anytime.
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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading && favorites.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // ── Authenticated ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        {isSyncing && <ActivityIndicator size="small" color="#6C63FF" />}
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <PlaceCard
                place={item.place}
                onPress={() => handlePlacePress(item.place)}
                onFavoritePress={() => handleRemoveFavorite(item.place.id)}
                isFavorite
            />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6C63FF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart on any place to save it here.
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push("/(tabs)/explore")}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreButtonText}>Explore places</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  exploreButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#814141",
    borderRadius: 12,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
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
});
