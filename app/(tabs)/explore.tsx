import PlaceCard from "@/components/PlaceCard";
import usePlacesStore from "@/store/placesStore";
import * as Location from 'expo-location';
import { Place } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {JSX, useCallback, useEffect, useState} from "react";
import {
  ActivityIndicator, Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DEBOUNCE_MS = 400;

/**
 * A screen that allows users to search for places or view nearby locations.
 *
 * The `ExploreScreen` component provides a user interface for searching locations via a search bar,
 * displaying search results, and showing nearby places if the search query is empty. It utilizes
 * debounced input handling for a better user experience and manages the loading and error states for
 * both search results and nearby locations. It also requests location permissions on mount to fetch
 * nearby places when location access is granted.
 *
 * @return {JSX.Element} The `ExploreScreen` user interface, including the search bar, loading state,
 * error messages, and a list of places (either search results or nearby places based on the state).
 */
export default function ExploreScreen(): JSX.Element {
  const {
    query,
    results,
    isSearching,
    searchError,
    nearbyPlaces,
    isLoadingNearby,
    nearbyError,
    setQuery,
    searchPlaces,
    clearSearch,
    fetchNearbyPlaces,
  } = usePlacesStore();

  const [debounceTimer, setDebounceTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  //
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required');
      return false;
    }
    return true;
  };

  // Load nearby places on mount
  useEffect(() => {
    (async () => {
      try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return;

        const loc = await Location.getCurrentPositionAsync();
        await fetchNearbyPlaces(loc.coords.latitude, loc.coords.longitude);
      } catch (err) {
        console.error('Location error:', err);
        // Don't crash - just show empty state
      }
    })();
  }, [fetchNearbyPlaces]);

  // Debounced search
  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (!text.trim()) {
        clearSearch();
        return;
      }
      const timer = setTimeout(() => searchPlaces(text), DEBOUNCE_MS);
      setDebounceTimer(timer);
    },
    [clearSearch, debounceTimer, searchPlaces, setQuery],
  );

  const handlePlacePress = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

  const isShowingResults = query.trim().length > 0;
  const displayList = isShowingResults ? results : nearbyPlaces;
  const isLoading = isShowingResults ? isSearching : isLoadingNearby;
  const displayError = isShowingResults ? searchError : nearbyError;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#9E9E9E"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places..."
            placeholderTextColor="#9E9E9E"
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && Platform.OS === "android" && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isShowingResults ? `Results for "${query}"` : "Nearby places"}
        </Text>
        {isLoading && <ActivityIndicator size="small" color="#6C63FF" />}
      </View>

      {/* Error */}
      {displayError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      )}

      {/* Places list */}
      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlaceCard place={item} onPress={() => handlePlacePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>
                {isShowingResults ? "No places found" : "No nearby places"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isShowingResults
                  ? "Try a different search term"
                  : "Enable location to see places near you"}
              </Text>
            </View>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 70 : 30,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A2E",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  errorBox: {
    marginHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
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
    paddingHorizontal: 32,
  },
});
