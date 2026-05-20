import PlaceCard from "@/components/PlaceCard";
import { useAuthStore } from "@/store/authStore";
import useFavoritesStore from "@/store/favoritesStore";
import { Place } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { JSX, useEffect, useState } from "react";
import { ScrollView, LayoutAnimation } from "react-native";
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
 * Renders the FavoritesScreen component, which displays a list of the user's saved favorite places,
 * along with features for filtering by category, refreshing the list, and removing favorites.
 * It adapts dynamically based on the user's authentication status and the current state of the data.
 *
 * @return {JSX.Element} The FavoritesScreen component with conditional rendering for
 * loading states, authentication status, and favorite place categories.
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from favorites
  const categories = Array.from(
      new Set(
          favorites
              .map((fav) => fav.place?.category)
              .filter(Boolean) as string[]
      )
  ).sort();

  // Filter favorites by selected category
  const filteredFavorites = selectedCategory
      ? favorites.filter((fav) => fav.place?.category === selectedCategory)
      : favorites;

  // Handle category selection with a smooth micro-animation
  const handleCategorySelect = (category: string | null) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setSelectedCategory(category);
  };

  // Log state changes for debugging
  useEffect(() => {
    console.log('Categories found:', categories);
    console.log('Favorites loaded:', favorites);
    console.log('Favorites length:', favorites.length);
  }, [favorites, categories]);

  // Fetch favorites when authenticated
  useEffect(() => {
    const fetchData = async () => { // Renamed slightly to avoid namespace confusion
      if (isAuthenticated) {
        await fetchFavorites();
      }
    };

    fetchData().catch((error) => {
      console.error("Failed to automatically synchronize user favorites on mount:", error);
    });
  }, [fetchFavorites, isAuthenticated]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  const handlePlacePress = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

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

        {/* Category Filter */}
        {categories.length > 0 && favorites.length > 0 && (
            <View style={styles.filterContainer}>
              <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScroll}
              >
                <TouchableOpacity
                    style={[
                      styles.filterTag,
                      selectedCategory === null && styles.filterTagActive,
                    ]}
                    onPress={() => handleCategorySelect(null)}
                >
                  <Text
                      style={[
                        styles.filterTagText,
                        selectedCategory === null && styles.filterTagTextActive,
                      ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>

                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                          styles.filterTag,
                          selectedCategory === category && styles.filterTagActive,
                        ]}
                        onPress={() => handleCategorySelect(category)}
                    >
                      <Text
                          style={[
                            styles.filterTagText,
                            selectedCategory === category &&
                            styles.filterTagTextActive,
                          ]}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
        )}

        {/* Error */}
        {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
        )}

        {/* List */}
        <FlatList
            data={filteredFavorites}
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
                <Text style={styles.emptyTitle}>
                  {selectedCategory
                      ? `No ${selectedCategory}s saved`
                      : "No favorites yet"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedCategory
                      ? "Try another category or explore more places."
                      : "Tap the heart on any place to save it here."}
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

// ── A set of predefined styles for various UI components used in the application. ──
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
  filterContainer: {
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20, // Rounded pill looks much more modern than a strict block corner
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterTagActive: {
    backgroundColor: "#CA3519",
    borderColor: "#CA3519",
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTagTextActive: {
    color: "#fff",
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
    paddingHorizontal: 24,
  },
  exploreButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#CA3519", // Fixed theme color to match the primary purple
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
    backgroundColor: "#CA3519",
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
    borderColor: "#CA3519",
  },
  signUpButtonText: {
    color: "#CA3519",
    fontSize: 16,
    fontWeight: "600",
  },
});