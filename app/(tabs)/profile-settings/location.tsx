import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { placesService } from "@/services/placesService";

interface CityPrediction {
    description: string;
    placeId: string;
}

export default function LocationScreen() {
    const [city, setCity] = useState("Boston, MA");
    const [suggestions, setSuggestions] = useState<CityPrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch city suggestions
    useEffect(() => {
        if (city.length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                setIsLoading(true);
                const predictions = await placesService.autocomplete(city);

                // Filter for cities/regions only
                const cities = (predictions as CityPrediction[]).filter((p) => {
                    const desc = p.description.toLowerCase();
                    return desc.includes('city') ||
                        desc.includes('town') ||
                        desc.includes('region') ||
                        desc.includes('administrative') ||
                        /^[^,]+,\s*[^,]+/.test(p.description);
                });

                setSuggestions(cities.slice(0, 5));
            } catch (error) {
                console.error('Error fetching cities:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [city]);

    const handleSelectCity = (selectedCity: string) => {
        setCity(selectedCity);
        setSuggestions([]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={styles.title}>Default Location</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>City/Region</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your default location"
                        value={city}
                        onChangeText={setCity}
                    />

                    {/* Suggestions dropdown */}
                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#6C63FF" />
                                </View>
                            )}
                            <ScrollView style={styles.suggestionsList}>
                                {suggestions.map((suggestion) => (
                                    <TouchableOpacity
                                        key={suggestion.placeId}
                                        style={styles.suggestionItem}
                                        onPress={() => handleSelectCity(suggestion.description)}
                                    >
                                        <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                                        <Text style={styles.suggestionText}>{suggestion.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <Text style={styles.hint}>
                        This location is used to show nearby places when you open the app.
                    </Text>
                </View>

                <TouchableOpacity style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
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
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A1A2E",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: "#1A1A2E",
        marginBottom: 8,
    },
    suggestionsContainer: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        marginBottom: 8,
        maxHeight: 200,
    },
    suggestionsList: {
        maxHeight: 200,
    },
    loadingContainer: {
        padding: 12,
        alignItems: "center",
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#F0F0F0",
        gap: 10,
    },
    suggestionText: {
        fontSize: 14,
        color: "#1A1A2E",
        flex: 1,
    },
    hint: {
        fontSize: 13,
        color: "#9CA3AF",
    },
    saveButton: {
        backgroundColor: "#0A0A0A",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 32,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});