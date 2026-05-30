import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { JSX, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import usePlacesStore from "@/store/placesStore";

interface Event {
    id: string;
    name: string;
    address: string;
    type: string;
    rating?: number;
    distance?: number;
    date: Date;
}

interface EventCardProps {
    event: Event;
    onPress: (event: Event) => void;
}

const EventCard = ({ event, onPress }: EventCardProps): JSX.Element => (
    <TouchableOpacity
        style={styles.eventCard}
        onPress={() => onPress(event)}
        activeOpacity={0.85}
    >
        <View style={styles.eventIcon}>
            <Ionicons name="calendar" size={24} color="#F59E0B" />
        </View>
        <View style={styles.eventContent}>
            <Text style={styles.eventName}>{event.name}</Text>
            <View style={styles.eventMeta}>
                <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                <Text style={styles.eventAddress}>{event.address}</Text>
            </View>
            <View style={styles.eventType}>
                <Text style={styles.eventTypeText}>{event.type}</Text>
                {event.distance && (
                    <Text style={styles.eventDistance}>{event.distance.toFixed(1)} km away</Text>
                )}
            </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
);

export default function EventsScreen(): JSX.Element {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const groupEventsByDate = (events: Event[]) => {
        const grouped: { [key: string]: Event[] } = {};

        events.forEach((event) => {
            const dateKey = event.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            });

            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(event);
        });

        return grouped;
    };

    const fetchEvents = async () => {
        try {
            setError(null);

            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setError('Location permission required to find nearby events');
                setIsLoading(false);
                return;
            }

            let location;

            try {
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            } catch (locErr) {
                console.warn('Location unavailable:', locErr);
                setError('Unable to get current location. Using fallback data.');
                setIsLoading(false);

                // fallback behavior (important)
                setEvents([]); // or default data
                return;
            }

            const { latitude, longitude } = location.coords;

            const {
                fetchNearbyPlaces,
            } = usePlacesStore();

            await fetchNearbyPlaces(latitude, longitude);

            const placeholderEvents: Event[] = [
                {
                    id: '1',
                    name: 'Friday Night Jazz',
                    address: '123 Music Street, Boston, MA',
                    type: 'Music Event',
                    distance: 1.2,
                    date: new Date(2026, 4, 23),
                },
            ];

            setEvents(placeholderEvents);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            await fetchEvents();
        })();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchEvents();
        setRefreshing(false);
    };

    const handleEventPress = (event: Event) => {
        // TODO: Navigate to event details
        console.log('Event pressed:', event);
    };

    // Not authenticated
    if (!isAuthenticated) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="calendar-outline" size={64} color="#E5E7EB" />
                <Text style={styles.gateTitle}>Discover Events</Text>
                <Text style={styles.gateSubtitle}>
                    Sign in to find events happening near you.
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

    // Loading
    if (isLoading && events.length === 0) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    // Content
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Events</Text>
                {refreshing && <ActivityIndicator size="small" color="#F59E0B" />}
            </View>

            {/* Error */}
            {error && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* List */}
            {events.length > 0 ? (
                <ScrollView
                    style={styles.listContainer}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#F59E0B"
                        />
                    }
                >
                    {Object.entries(groupEventsByDate(events)).map(([date, dateEvents]) => (
                        <View key={date}>
                            <Text style={styles.dateLabel}>{date}</Text>
                            {dateEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onPress={handleEventPress}
                                />
                            ))}
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={80} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>No events nearby</Text>
                    <Text style={styles.emptySubtitle}>
                        Check back later for events happening in your area.
                    </Text>
                </View>
            )}
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
        paddingTop: Platform.OS === "ios" ? 60 : 60,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A2E",
        textAlign: 'center',
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
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 32,
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A2E",
        marginTop: 16,
        marginBottom: 8,
    },
    eventCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: "#E5E7EB",
    },
    eventIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: "#FEF3C7",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    eventContent: {
        flex: 1,
        gap: 4,
    },
    eventName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1A1A2E",
    },
    eventMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    eventAddress: {
        fontSize: 12,
        color: "#9CA3AF",
        flex: 1,
    },
    eventType: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    eventTypeText: {
        fontSize: 11,
        fontWeight: "500",
        color: "#FDFEFE",
        backgroundColor: "#28B463",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    eventDistance: {
        fontSize: 11,
        color: "#9CA3AF",
        fontWeight: "500",
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
        backgroundColor: "#F59E0B",
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
        borderColor: "#F59E0B",
    },
    signUpButtonText: {
        color: "#F59E0B",
        fontSize: 16,
        fontWeight: "600",
    },
});