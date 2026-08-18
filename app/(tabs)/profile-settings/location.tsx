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
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { placesService } from "@/services/placesService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_CITY = "Boston, MA";
const STORAGE_KEY = "crowdy_default_location";

interface CityPrediction {
    description: string;
    placeId: string;
}

export default function LocationScreen() {
    const [city, setCity] = useState(DEFAULT_CITY);
    const [suggestions, setSuggestions] = useState<CityPrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load previously saved location on mount. Without this, the "Save
    // Location" button would have nothing to persist against — the screen
    // would keep resetting to DEFAULT_CITY every time it's reopened.
    useEffect(() => {
        const loadSavedLocation = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) setCity(saved);
            } catch (err) {
                console.error("Failed to load saved location:", err);
            }
        };
        loadSavedLocation();
    }, []);

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

    /**
     * Persists the selected default location to AsyncStorage, consistent with
     * how the app already persists other client-only prefs (favorites,
     * activity log). Previously this button had no handler at all.
     */
    const handleSaveLocation = async () => {
        if (!city.trim()) {
            Alert.alert("Error", "Location cannot be empty");
            return;
        }

        try {
            setIsSaving(true);
            await AsyncStorage.setItem(STORAGE_KEY, city.trim());
            Alert.alert("Success", "Default location saved!");
            router.back();
        } catch (err) {
            console.error("Failed to save location:", err);
            Alert.alert("Error", "Something went wrong saving your location.");
        } finally {
            setIsSaving(false);
        }
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
                        editable={!isSaving}
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

                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSaveLocation}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? "Saving..." : "Save Location"}
                    </Text>
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
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});