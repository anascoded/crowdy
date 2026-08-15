import CrowdHistoryChart from "@/components/CrowdHistoryChart";
import CrowdMeter from "@/components/CrowdMeter";
import { useCrowdHistory } from "@/hooks/useCrowdHistory";
import { useCrowdLive } from "@/hooks/useCrowdLive";
import { placesService } from "@/services/placesService";
import { useAuthStore } from "@/store/authStore";
import useFavoritesStore from "@/store/favoritesStore";
import { Place } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { JSX, useEffect, useMemo, useState } from "react";
import { Linking } from 'react-native';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {capitalizeWords} from "@/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Displays the details of a specific place, including its name, category, address, live crowd data,
 * and historical crowd data. The screen also allows users to toggle the place as a favorite if authenticated.
 *
 * The component handles fetching place details and managing the UI state for loading and error conditions.
 * It integrates live crowd data and historical crowd data for enhanced user insights.
 *
 * @return {JSX.Element} The rendered UI for the place detail screen, including loading and error states,
 * the place's hero image, live crowd data, crowd history, and favorite functionality.
 */
export default function PlaceDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();

  const { data: crowdLive, isLoading: isLoadingCrowd } = useCrowdLive(
      id ?? null,
  );
  const { data: crowdHistory } = useCrowdHistory(id ?? null);

  const [place, setPlace] = useState<Place | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const favorited = place ? isFavorite(place.id) : false;
  const [isVisited, setIsVisited] = useState(false);

  // Ticks forward every minute so "best time to visit" re-evaluates as the
  // clock crosses into a new hour, instead of freezing at load time.
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // ── Fetch place details ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const fetchPlace = async () => {
      try {
        setIsLoadingPlace(true);
        const data = await placesService.getById(id);
        setPlace(data);
      } catch (err: any) {
        setError(err.message ?? "Failed to load place");
      } finally {
        setIsLoadingPlace(false);
      }
    };

    // Fetch place details when the component mounts or when the id changes
    fetchPlace().catch((error) => {
      console.error("Unhandled exception inside fetchPlace hook execution:", error);
    });
  }, [id]);

  // Load visited status on mount
  useEffect(() => {
    const loadVisitedStatus = async () => {
      try {
        const visited = await AsyncStorage.getItem(`visited_${id}`);
        setIsVisited(visited === 'true');
      } catch (err) {
        console.error('Failed to load visited status:', err);
      }
    };

    if (id) loadVisitedStatus();
  }, [id]);

  /**
   * Logs a user activity, such as adding or removing a favorite location, and stores it persistently.
   * The activity is saved along with a timestamp and other related details in local storage.
   * Only the most recent 10 activities are retained.
   *
   * @param {'favorite_added' | 'favorite_removed'} type - The type of activity performed by the user.
   * @param {string} placeName - The name of the place associated with the activity.
   * @returns {Promise<void>} A promise that resolves once the activity is successfully logged and saved.
   */
  const logActivity = async (type: 'favorite_added' | 'favorite_removed' | 'place_visited' | 'place_unvisited', placeName: string): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem('crowdy_activities') || '[]';
      const activities = JSON.parse(stored);

      const newActivity = {
        id: Date.now().toString(),
        type,
        placeName,
        timestamp: new Date().toISOString(),
      };

      const updated = [newActivity, ...activities].slice(0, 10);
      await AsyncStorage.setItem('crowdy_activities', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  // ── Toggle favorite ────────────────────────────────────────────────────────
  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      router.push({ pathname: "/(auth)/sign-in" });
      return;
    }
    if (!place) return;

    if (favorited) {
      await removeFavorite(place.id);
      await logActivity('favorite_removed', place.name);
    } else {
      await addFavorite(place);
      await logActivity('favorite_added', place.name);
    }
  };

  const handleVisited = async () => {
    if (!place) return;

    const newVisitedStatus = !isVisited;
    setIsVisited(newVisitedStatus);

    try {
      await AsyncStorage.setItem(`visited_${id}`, newVisitedStatus.toString());
      await logActivity(newVisitedStatus ? 'place_visited' : 'place_unvisited', place.name);
    } catch (err) {
      console.error('Failed to save visited status:', err);
    }
  };

  /**
   * Asynchronously opens the device's map application with the specified location and place details.
   *
   * The function determines the appropriate map URL scheme based on the platform (iOS, Android, or Web)
   * and attempts to open the corresponding map application or service. If the place information is missing, the function exits gracefully.
   *
   * @function handleOpenMaps
   * @async
   *
   * @throws Will log an error to the console if it fails to open the maps.
   *
   * @remarks
   * - For iOS devices, it uses the Apple Maps URL scheme.
   * - For Android devices, it uses the Google Maps URL scheme with the geo protocol.
   * - For other platforms, it defaults to using Google Maps in the browser.
   * - Encodes the place name to ensure special characters in the name do not cause URL issues.
   */
  const handleOpenMaps = async () => {
    if (!place) return;

    const { lat, lng } = place.location;
    const placeName = encodeURIComponent(place.name);

    // iOS and Android map URLs
    const iosUrl = `maps://maps.apple.com/?daddr=${lat},${lng}&q=${placeName}`;
    const androidUrl = `geo:${lat},${lng}?q=${placeName}`;
    const webUrl = `https://maps.google.com/?q=${lat},${lng}`;

    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL(iosUrl);
      } else if (Platform.OS === 'android') {
        await Linking.openURL(androidUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open maps:', error);
    }
  };

  /**
   * Finds the best time to visit based on the lowest crowd level in the future.
   * Returns the hour and crowd percentage of the least busy time.
   */
  const getBestTimeToVisit = () => {
    if (!crowdHistory?.days || crowdHistory.days.length === 0) {
      return null;
    }

    const today = crowdHistory.days[crowdHistory.days.length - 1];

    if (!today?.hours) {
      return null;
    }

    const currentHour = now.getHours();

    // Filter future hours today
    let futureHours = today.hours.filter((h) => h.hour > currentHour);

    // If no future hours today, just show the best hour overall
    if (futureHours.length === 0) {
      futureHours = today.hours;
    }

    if (futureHours.length === 0) {
      return null;
    }

    // Find hour with lowest crowd
    const bestHour = futureHours.reduce((min, current) =>
        current.crowd < min.crowd ? current : min
    );

    return bestHour;
  };

  /**
   * Converts a given hour in 24-hour format to a string representing the time in 12-hour format with AM/PM.
   *
   * @param {number} hour - The hour in 24-hour format. Should be a number between 0 and 23 inclusive.
   * @returns {string} The formatted time string in 12-hour format with AM/PM.
   */
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  // Recomputed whenever fresh history data arrives (every 30 min) or the
  // clock ticks into a new hour (every 60s) — see the `now` state above.
  const bestTime = useMemo(
      () => getBestTimeToVisit(),
      [crowdHistory, now]
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoadingPlace) {
    return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !place) {
    return (
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error ?? "Place not found"}</Text>
          <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
    );
  }

  // ── Content ────────────────────────────────────────────────────────────────
  return (
      <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
        </TouchableOpacity>

        {/* Hero image */}
        <View style={styles.hero}>
          {place.photoUrl ? (
              <Image source={{ uri: place.photoUrl }} style={styles.heroImage} />
          ) : (
              <View style={styles.heroFallback}>
                <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              </View>
          )}
        </View>

        {/* Place info */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{capitalizeWords(place.category)}</Text>
            </View>
            {place.rating && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
                </View>
            )}
          </View>

          <Text style={styles.placeName}>{place.name}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={styles.addressText}>{place.address}</Text>
          </View>

          {/* Favorite button overlay */}
          <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoriteToggle}
              activeOpacity={0.85}
          >
            <Ionicons
                name={favorited ? "heart" : "heart-outline"}
                size={31}
                color={favorited ? "#FF6467" : "#0A0A0A"}
            />
          </TouchableOpacity>

          {/* Visited button */}
          <TouchableOpacity
              style={styles.visitedButton}
              onPress={handleVisited}
              activeOpacity={0.85}
          >
            <Ionicons
                name={isVisited ? "bookmark" : "bookmark-outline"}
                size={28}
                color={isVisited ? "#0A0A0A" : "#0A0A0A"}
            />
          </TouchableOpacity>

          {/* Direction button */}
          <TouchableOpacity
              style={styles.directionButton}
              onPress={handleOpenMaps}
              activeOpacity={0.85}
          >
            <Ionicons
                name="navigate-circle"
                size={35}
                color="#31C950"
            />
          </TouchableOpacity>

        </View>

        {/* Live crowd meter */}
        <View style={styles.section}>
          {isLoadingCrowd ? (
              <View style={styles.crowdLoading}>
                <ActivityIndicator size="small" color="#6C63FF" />
                <Text style={styles.crowdLoadingText}>Loading crowd data...</Text>
              </View>
          ) : crowdLive ? (
              <CrowdMeter crowd={crowdLive} />
          ) : (
              <Text style={styles.noDataText}>No live data available</Text>
          )}
        </View>

        {/* Crowd history chart */}
        <View style={styles.section}>
          {isLoadingCrowd ? (
              <View style={styles.crowdLoading}>
                <ActivityIndicator size="small" color="#6C63FF" />
              </View>
          ) : crowdHistory ? (
              <CrowdHistoryChart history={crowdHistory} />
          ) : (
              <Text style={styles.noDataText}>No history available</Text>
          )}
        </View>

        {/* Best Time to Visit */}
        <View style={styles.section}>
          {bestTime ? (
              <View style={styles.bestTimeContainer}>
                <Text style={styles.sectionTitle}>Best Time to Visit</Text>
                <View style={styles.bestTimeContent}>
                  <Ionicons name="walk" size={24} color="#0A0A0A" />
                  <View style={styles.bestTimeText}>
                    <Text style={styles.bestTimeLabel}>Least Crowded</Text>
                    <Text style={styles.bestTimeValue}>
                      <Ionicons name="time-outline" size={16} color="#9CA3AF" /> {formatHour(bestTime.hour)} - {bestTime.crowd}% busy
                    </Text>
                  </View>
                </View>
                <View style={styles.bestTimeCrowd}>
                  <View
                      style={[
                        styles.bestTimeCrowdBar,
                        { width: `${bestTime.crowd}%`, backgroundColor: '#31C950' },
                      ]}
                  />
                </View>
              </View>
          ) : (
              <Text style={styles.noDataText}>No future times available</Text>
          )}
        </View>
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
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
    backgroundColor: "#F9FAFB",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 60,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#CA3519",
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  hero: {
    height: 240,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  visitedButton: {
    position: "absolute",
    top: 12,
    right: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  directionButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryBadge: {
    backgroundColor: "#FAD341",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#303030",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  placeName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addressText: {
    fontSize: 12,
    color: "#9CA3AF",
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 10,
  },
  crowdLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  crowdLoadingText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  noDataText: {
    fontSize: 14,
    color: "#9CA3AF",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  bestTimeContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  bestTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bestTimeText: {
    flex: 1,
  },
  bestTimeLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  bestTimeValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 2,
  },
  bestTimeCrowd: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  bestTimeCrowdBar: {
    height: "100%",
    borderRadius: 3,
  },
});