import PlaceCard from "@/components/PlaceCard";
import { useAuthStore } from "@/store/authStore";
import useFavoritesStore from "@/store/favoritesStore";
import { Place } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { JSX, useEffect, useState, useMemo } from "react";
import { ScrollView, LayoutAnimation, Modal } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const MAP_VISIBILITY_KEY = "crowdy_favorites_map_visible";

/**
 * Computes a Region that fits all given places' locations, with padding.
 * Returns null if none of the places have a usable location — callers should
 * skip rendering the map entirely in that case rather than passing MapView a
 * meaningless region.
 */
function getRegionForPlaces(places: Place[]): Region | null {
  const locations = places
      .map((p) => p.location)
      .filter((loc): loc is { lat: number; lng: number } => !!loc);

  if (locations.length === 0) return null;

  const lats = locations.map((l) => l.lat);
  const lngs = locations.map((l) => l.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    // Pad the fitted region a bit so edge markers aren't flush against the
    // border, with a floor so a single favorite doesn't zoom in absurdly far.
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.02),
  };
}

/**
 * Renders the FavoritesScreen component, which displays a list of the user's saved favorite places,
 * along with features for filtering by category, refreshing the list, and removing favorites.
 * It adapts dynamically based on the user's authentication status and the current state of the data.
 *
 * Also supports an optional map view: a toggle in the header shows/hides a
 * small non-interactive map preview above the list, which expands to a
 * fullscreen interactive map on tap. Off by default; the choice persists
 * across app restarts via AsyncStorage.
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
  const [showMap, setShowMap] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

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

  const mapRegion = useMemo(
      () => getRegionForPlaces(filteredFavorites.map((f) => f.place)),
      [filteredFavorites]
  );

  // Handle category selection with a smooth micro-animation
  const handleCategorySelect = (category: string | null) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setSelectedCategory(category);
  };

  // Load the persisted map-visibility preference on mount. Defaults to off
  // (list-only) if nothing has been saved yet.
  useEffect(() => {
    AsyncStorage.getItem(MAP_VISIBILITY_KEY)
        .then((val) => {
          if (val !== null) setShowMap(val === "true");
        })
        .catch((err) => console.error("Failed to load map visibility preference:", err));
  }, []);

  const handleToggleMap = () => {
    const next = !showMap;
    setShowMap(next);
    AsyncStorage.setItem(MAP_VISIBILITY_KEY, next.toString()).catch((err) =>
        console.error("Failed to save map visibility preference:", err)
    );
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

  /**
   * Asynchronous function to handle the refresh action.
   *
   * Sets the refreshing state to true before initiating
   * the process to fetch favorites. After the favorites
   * are successfully fetched, it resets the refreshing
   * state to false.
   *
   * @returns {Promise<void>} A Promise that resolves when the refresh action is complete.
   */
  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  /**
   * Handles the action when a place is selected.
   *
   * This function is triggered when a specific place is pressed or selected.
   * It navigates the user to the dynamic route associated with the selected place's ID.
   *
   * @param {Place} place - The selected place object containing details such as its unique ID.
   */
  const handlePlacePress = (place: Place) => {
    setIsMapExpanded(false);
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
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Favorites</Text>
          <TouchableOpacity
              style={styles.mapToggleButton}
              onPress={handleToggleMap}
              activeOpacity={0.7}
          >
            <Ionicons
                name={showMap ? "map" : "map-outline"}
                size={22}
                color={showMap ? "#FAD341" : "#1A1A2E"}
            />
          </TouchableOpacity>
          {isSyncing && <ActivityIndicator size="small" color="#6C63FF" style={styles.syncIndicator} />}
        </View>

        {/* Map preview — non-interactive, tap to expand fullscreen. Only
            rendered if there's at least one favorite with a usable location. */}
        {showMap && mapRegion && (
            <TouchableOpacity
                style={styles.mapPreviewContainer}
                activeOpacity={0.85}
                onPress={() => setIsMapExpanded(true)}
            >
              <MapView
                  style={styles.mapPreview}
                  region={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  pointerEvents="none"
              >
                {filteredFavorites.map((fav) => (
                    <Marker
                        key={fav.place.id}
                        coordinate={{
                          latitude: fav.place.location.lat,
                          longitude: fav.place.location.lng,
                        }}
                    />
                ))}
              </MapView>
              <View style={styles.mapPreviewOverlay}>
                <Ionicons name="expand-outline" size={16} color="#fff" />
                <Text style={styles.mapPreviewOverlayText}>Tap to expand</Text>
              </View>
            </TouchableOpacity>
        )}

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
                  <Text style={styles.exploreButtonText}>Start exploring</Text>
                </TouchableOpacity>
              </View>
            }
        />

        {/* Fullscreen interactive map */}
        <Modal
            visible={isMapExpanded}
            animationType="slide"
            onRequestClose={() => setIsMapExpanded(false)}
        >
          <View style={styles.fullscreenContainer}>
            {mapRegion && (
                <MapView style={styles.fullscreenMap} initialRegion={mapRegion}>
                  {filteredFavorites.map((fav) => (
                      <Marker
                          key={fav.place.id}
                          coordinate={{
                            latitude: fav.place.location.lat,
                            longitude: fav.place.location.lng,
                          }}
                          title={fav.place.name}
                          description={fav.place.address}
                          onCalloutPress={() => handlePlacePress(fav.place)}
                      />
                  ))}
                </MapView>
            )}
            <TouchableOpacity
                style={styles.fullscreenCloseButton}
                onPress={() => setIsMapExpanded(false)}
                activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
          </View>
        </Modal>
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
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 60,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  headerSpacer: {
    width: 28,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  mapToggleButton: {
    width: 28,
    alignItems: "flex-end",
  },
  syncIndicator: {
    marginLeft: 8,
  },
  mapPreviewContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  mapPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPreviewOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10,10,10,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  mapPreviewOverlayText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  fullscreenContainer: {
    flex: 1,
  },
  fullscreenMap: {
    ...StyleSheet.absoluteFillObject,
  },
  fullscreenCloseButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 24,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#DFDEDA',
  },
  filterScroll: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterTagActive: {
    backgroundColor: "#FDCD5D",
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTagTextActive: {
    color: "#0A0A0A",
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
    backgroundColor: "#FAD341",
    borderRadius: 10,
  },
  exploreButtonText: {
    color: "#303030",
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