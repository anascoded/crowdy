import CrowdHistoryChart from "@/components/CrowdHistoryChart";
import CrowdMeter from "@/components/CrowdMeter";
import { useCrowdHistory } from "@/hooks/useCrowdHistory";
import { useCrowdLive } from "@/hooks/useCrowdLive";
import { placesService } from "@/services/placesService";
import useAuthStore from "@/store/authStore";
import useFavoritesStore from "@/store/favoritesStore";
import { Place } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {JSX, useEffect, useState} from "react";
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

    fetchPlace();
  }, [id]);

  // ── Toggle favorite ────────────────────────────────────────────────────────
  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      router.push({ pathname: "/(auth)/sign-in" });
      return;
    }
    if (!place) return;

    if (favorited) {
      await removeFavorite(place.id);
    } else {
      await addFavorite(place);
    }
  };

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
      {/* Hero image */}
      <View style={styles.hero}>
        {place.photoUrl ? (
          <Image source={{ uri: place.photoUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroFallback}>
            <Ionicons name="location-outline" size={48} color="#9CA3AF" />
          </View>
        )}

        {/* Favorite button overlay */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
          activeOpacity={0.85}
        >
          <Ionicons
            name={favorited ? "heart" : "heart-outline"}
            size={24}
            color={favorited ? "#EF4444" : "#fff"}
          />
        </TouchableOpacity>
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
      </View>

      {/* Live crowd meter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>  Live Crowd</Text>
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
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#6C63FF",
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
    top: Platform.OS === "ios" ? 16 : 12,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
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
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6C63FF",
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
    fontSize: 13,
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
});
