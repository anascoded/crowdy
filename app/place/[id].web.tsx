// app/place/[id].web.tsx — reuses every hook/store from the native version,
// only the JSX/layout differs
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
// @ts-ignore
import { JSX, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { capitalizeWords } from "@/utils";

export default function PlaceDetailScreenWeb(): JSX.Element {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isAuthenticated } = useAuthStore();
    const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
    const { data: crowdLive, isLoading: isLoadingCrowd } = useCrowdLive(id ?? null);
    const { data: crowdHistory } = useCrowdHistory(id ?? null);

    const [place, setPlace] = useState<Place | null>(null);
    const [isLoadingPlace, setIsLoadingPlace] = useState(true);
    const favorited = place ? isFavorite(place.id) : false;

    useEffect(() => {
        if (!id) return;
        placesService.getById(id).then(setPlace).finally(() => setIsLoadingPlace(false));
    }, [id]);

    const handleFavoriteToggle = async () => {
        if (!isAuthenticated) return router.push({ pathname: "/(auth)/sign-in" });
        if (!place) return;
        favorited ? await removeFavorite(place.id) : await addFavorite(place);
    };

    if (isLoadingPlace) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#6C63FF" /></View>;
    }
    if (!place) return <View style={styles.centered}><Text>Place not found</Text></View>;

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.grid}>
                {/* Left column */}
                <View style={styles.leftCol}>
                    {place.photoUrl ? (
                        <Image source={{ uri: place.photoUrl }} style={styles.heroImage} />
                    ) : (
                        <View style={styles.heroFallback}><Ionicons name="location-outline" size={48} color="#9CA3AF" /></View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.badge}>{capitalizeWords(place.category)}</Text>
                        {place.rating && <Text style={styles.rating}>★ {place.rating.toFixed(1)}</Text>}
                    </View>
                    <Text style={styles.title}>{place.name}</Text>
                    <Text style={styles.address}>{place.address}</Text>
                    <TouchableOpacity onPress={handleFavoriteToggle} style={styles.favoriteBtn}>
                        <Ionicons name={favorited ? "heart" : "heart-outline"} size={22} color={favorited ? "#FF6467" : "#1A1A2E"} />
                        <Text style={styles.favoriteBtnText}>{favorited ? "Saved" : "Save"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Right column */}
                <View style={styles.rightCol}>
                    {isLoadingCrowd ? <ActivityIndicator /> : crowdLive && <CrowdMeter crowd={crowdLive} />}
                    {crowdHistory && <CrowdHistoryChart history={crowdHistory} />}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    page: { padding: 40, maxWidth: 1100, alignSelf: "center", width: "100%" },
    grid: { flexDirection: "row", gap: 40 },
    leftCol: { flex: 1, gap: 12 },
    rightCol: { flex: 1, gap: 20 },
    heroImage: { width: "100%", height: 320, borderRadius: 16 },
    heroFallback: { width: "100%", height: 320, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
    infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
    badge: { backgroundColor: "#FAD341", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: "500" },
    rating: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
    title: { fontSize: 28, fontWeight: "700", color: "#1A1A2E" },
    address: { fontSize: 14, color: "#6B7280" },
    favoriteBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", alignSelf: "flex-start" },
    favoriteBtnText: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
});