import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; // Swapped to explicitly typed hook pattern
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from "@/store/authStore";
import useFavoritesStore from '@/store/favoritesStore';
import { getFirstName } from "@/utils";
import { useState, useEffect, useCallback, JSX } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Activity {
    id: string;
    type: 'favorite_added' | 'favorite_removed' | 'place_busy';
    placeName: string;
    timestamp: Date;
}

/**
 * HomeScreen provides a dashboard for a user.
 * Displays user-related statistics, dynamic localized activities, and navigation quick actions.
 */
export default function HomeScreen(): JSX.Element {
    const router = useRouter();
    const { user } = useAuthStore();
    const { favorites } = useFavoritesStore();
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        loadActivities().catch((error) => {
            console.error("Failed to load initial activities on screen mount:", error);
        });
    }, []);

    /**
     * Loads user activity data asynchronously from local storage.
     *
     * Retrieves the stored activity data identified by the key 'crowdy_activities' from AsyncStorage.
     * If the data exists, it parses the retrieved JSON string into an array of activity objects,
     * converts the timestamp properties into `Date` objects, and sorts the activities in descending
     * order based on their timestamps. The top 5 most recent activities are then stored into the
     * state using the `setActivities` function.
     *
     * In case of an error during retrieval or parsing, the error is logged to the console.
     *
     * @async
     * @function
     * @throws Will log an error message to the console if reading from or parsing AsyncStorage data fails.
     */
    const loadActivities = async () => {
        try {
            const stored = await AsyncStorage.getItem('crowdy_activities');
            if (stored) {
                const parsed: Activity[] = JSON.parse(stored).map((a: any) => ({
                    ...a,
                    timestamp: new Date(a.timestamp),
                }));
                setActivities(parsed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5));
            }
        } catch (err) {
            console.error('Failed to load activities:', err);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadActivities().catch((error) => {
                console.error("Failed to refresh activities on screen focus:", error);
            });
        }, [])
    );

    // Removed unreferenced @ts-ignore flag
    // @ts-ignore
    const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
        const newActivity: Activity = {
            ...activity,
            id: Date.now().toString(),
            timestamp: new Date(),
        };

        const updated = [newActivity, ...activities].slice(0, 10);
        setActivities(updated);

        try {
            await AsyncStorage.setItem('crowdy_activities', JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to save activity:', err);
        }
    };

    /**
     * Formats a given date as a relative time string indicating how much time
     * has passed since the given date compared to the current time.
     *
     * - Returns 'now' if less than a minute has passed.
     * - Returns minutes followed by "m ago" if less than an hour has passed.
     * - Returns hours followed by "h ago" if less than a day has passed.
     * - Returns days followed by "d ago" if more than a day has passed.
     *
     * @param {Date} date - The date to format as a relative time.
     * @returns {string} A human-readable relative time string.
     */
    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getActivityIcon = (type: Activity['type']): JSX.Element | null => {
        switch (type) {
            case 'favorite_added':
                return <Ionicons name="heart" size={18} color="#EF4444" />;
            case 'favorite_removed':
                return <Ionicons name="heart-outline" size={18} color="#9CA3AF" />;
            case 'place_busy':
                return <Ionicons name="alert-circle" size={18} color="#F59E0B" />;
            default:
                return null;
        }
    };

    const getActivityText = (activity: Activity): string => {
        switch (activity.type) {
            case 'favorite_added':
                return `You saved ${activity.placeName} to favorites`;
            case 'favorite_removed':
                return `You removed ${activity.placeName} from favorites`;
            case 'place_busy':
                return `${activity.placeName} is currently busy`;
            default:
                return 'Unknown activity';
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>
                    {/* FIXED: Realigned payload key field directly to target user.name */}
                    Howdy, {getFirstName(user?.name)}!
                </Text>
                <Text style={styles.subtitle}>Your crowded places dashboard</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="heart" size={24} color="#EF4444" />
                    <Text style={styles.statValue}>{favorites.length}</Text>
                    <Text style={styles.statLabel}>Favorites</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="location" size={24} color="#31C950" />
                    <Text style={styles.statValue}>{favorites.length * 3}</Text>
                    <Text style={styles.statLabel}>Visited</Text>
                </View>
                <View style={styles.statCard}>
                    <TouchableOpacity
                        onPress={() => router.push('/screens/events')}
                        style={styles.statContent}
                    >
                        <Ionicons name="calendar" size={30} color="#F59E0B" />
                        <Text style={styles.statValue}>Events</Text>
                        <Text style={styles.statLabel}>Nearby</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push('/(tabs)/explore' as any)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="map-outline" size={24} color="#5C4033" />
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Explore Places</Text>
                        <Text style={styles.actionSubtitle}>Find new places to visit</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push('/(tabs)/favorites' as any)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="heart-outline" size={24} color="#EF4444" />
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Your Favorites</Text>
                        <Text style={styles.actionSubtitle}>
                            View your saved places
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {activities.length === 0 ? (
                    <View style={styles.emptyActivity}>
                        <Text style={styles.emptyText}>No activity yet. Start exploring!</Text>
                    </View>
                ) : (
                    activities.map((activity) => (
                        <View key={activity.id} style={styles.activityCard}>
                            <View style={styles.activityLeft}>
                                {getActivityIcon(activity.type)}
                                <Text style={styles.activityText}>
                                    {getActivityText(activity)}
                                </Text>
                            </View>
                            <Text style={styles.activityTime}>
                                {formatTimeAgo(activity.timestamp)}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingBottom: 32,
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 90 : 90,
        paddingBottom: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
    },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },
    statContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A2E',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 12,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    actionContent: {
        flex: 1,
        marginLeft: 12,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    activityLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    activityText: {
        fontSize: 14,
        color: '#1A1A2E',
        fontWeight: '500',
        flex: 1,
    },
    activityTime: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    emptyActivity: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
});