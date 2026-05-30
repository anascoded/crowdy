import { Place } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {capitalizeWords} from "@/utils";
import {JSX} from "react";

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

/**
 * Renders a card component displaying details about a place, including its name,
 * address, category, rating, and a favorite toggle button. The card is touchable
 * and supports actions for pressing on the card and toggling the favorite status.
 *
 * @param {Object} props - The properties passed to the PlaceCard component.
 * @param {Object} props.place - The place object containing details about the place.
 * @param {string} props.place.name - The name of the place.
 * @param {string} props.place.address - The address of the place.
 * @param {string} props.place.category - The category of the place (e.g., restaurant, park).
 * @param {string} [props.place.photoUrl] - The URL of the place's photo, if available.
 * @param {number} [props.place.rating] - The average rating of the place.
 * @param {Function} props.onPress - Callback function to be executed when the card is pressed.
 * @param {Function} [props.onFavoritePress] - Callback function to be executed when the favorite button is pressed.
 * @param {boolean} [props.isFavorite=false] - Indicates whether the place is currently marked as a favorite.
 *
 * @return {JSX.Element} The PlaceCard component.
 */
export default function PlaceCard({
  place,
  onPress,
  onFavoritePress,
  isFavorite = false,
}: PlaceCardProps): JSX.Element {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {place.photoUrl ? (
          <Image source={{ uri: place.photoUrl }} style={styles.image} />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="location-outline" size={24} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {place.address}
        </Text>
        <View style={styles.meta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{capitalizeWords(place.category)}</Text>
          </View>
          {place.rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Favorite button */}
      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? "#EF4444" : "#9CA3AF"}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  address: {
    fontSize: 13,
    color: "#6B7280",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: "#FDCD5D",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#0A0A0A",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  favoriteButton: {
    paddingLeft: 8,
  },
});
