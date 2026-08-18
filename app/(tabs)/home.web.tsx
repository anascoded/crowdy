import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
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
 * Desktop variant of HomeScreen. Same data sources (authStore, favoritesStore,
 * AsyncStorage-backed activity log) as native — laid out as a two-column
 * dashboard instead of a single stacked scroll, since desktop has the width
 * to show stats/actions and recent activity side by side at once.
 */
export default function HomeScreenWeb(): JSX.Element {
    const router = useRouter();
    const { user } = useAuthStore();
    const { favorites } = useFavoritesStore();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);

    const loadActivities = async () => {
        try {
            const stored = await AsyncStorage.getItem('crowdy_activities');
            if (stored) {
                const parsed: Activity[] = JSON.parse(stored).map((a: any) => ({
                    ...a,
                    timestamp: new Date(a.timestamp),
                }));
                setActivities(parsed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8));
            }
        } catch (err) {
            console.error('Failed to load activities:', err);
        }
    };

    useEffect(() => {
        loadActivities().catch((error) => {
            console.error("Failed to load initial activities on screen mount:", error);
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadActivities().catch((error) => {
                console.error("Failed to refresh activities on screen focus:", error);
            });
        }, [])
    );

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
                return <Ionicons name="heart" size={20} color="#EF4444" />;
            case 'favorite_removed':
                return <Ionicons name="heart-outline" size={20} color="#EF4444" />;
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

    const QUICK_ACTIONS = [
        {
            key: 'explore',
            icon: 'map-outline' as const,
            color: '#5C4033',
            title: 'Explore Places',
            subtitle: 'Find new places to visit',
            route: '/(tabs)/explore',
        },
        {
            key: 'favorites',
            icon: 'heart-outline' as const,
            color: '#EF4444',
            title: 'Your Favorites',
            subtitle: 'View your saved places',
            route: '/(tabs)/favorites',
        },
        {
            key: 'events',
            icon: 'calendar-outline' as const,
            color: '#28B463',
            title: 'Upcoming Events',
            subtitle: 'See what\'s happening nearby',
            route: '/(tabs)/events',
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Howdy, {getFirstName(user?.name)}!</Text>
                <Text style={styles.subtitle}>Where are we going today?</Text>
            </View>

            <View style={styles.page}>
                <View style={styles.grid}>
                    {/* Left column — stats + quick actions */}
                    <View style={styles.leftCol}>
                        <View style={styles.statsRow}>
                            <Pressable
                                style={styles.statCard}
                                onPress={() => router.push('/(tabs)/favorites')}
                            >
                                <Ionicons name="heart" size={28} color="#EF4444" />
                                <Text style={styles.statValue}>{favorites.length}</Text>
                                <Text style={styles.statLabel}>Favorites</Text>
                            </Pressable>
                            <View style={styles.statCard}>
                                <Ionicons name="location" size={28} color="#31C950" />
                                <Text style={styles.statValue}>{favorites.length * 3}</Text>
                                <Text style={styles.statLabel}>Visited</Text>
                            </View>
                            <Pressable
                                style={styles.statCard}
                                onPress={() => router.push('/(tabs)/events')}
                            >
                                <Ionicons name="calendar" size={28} color="#28B463" />
                                <Text style={styles.statValue}>10</Text>
                                <Text style={styles.statLabel}>Events</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <View style={styles.actionsGrid}>
                            {QUICK_ACTIONS.map((action) => (
                                <Pressable
                                    key={action.key}
                                    style={[
                                        styles.actionCard,
                                        hoveredAction === action.key && styles.actionCardHovered,
                                    ]}
                                    onHoverIn={() => setHoveredAction(action.key)}
                                    onHoverOut={() => setHoveredAction(null)}
                                    onPress={() => router.push(action.route as any)}
                                >
                                    <Ionicons name={action.icon} size={28} color={action.color} />
                                    <Text style={styles.actionTitle}>{action.title}</Text>
                                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Right column — persistent activity sidebar */}
                    <View style={styles.rightCol}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        {activities.length === 0 ? (
                            <View style={styles.emptyActivity}>
                                <Text style={styles.emptyText}>No activity yet. Start exploring!</Text>
                            </View>
                        ) : (
                            <View style={styles.activityList}>
                                {activities.map((activity) => (
                                    <View key={activity.id} style={styles.activityCard}>
                                        <View style={styles.activityLeft}>
                                            {getActivityIcon(activity.type)}
                                            <Text style={styles.activityText}>{getActivityText(activity)}</Text>
                                        </View>
                                        <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { paddingBottom: 48 },
    header: {
        backgroundColor: '#FAD341',
        paddingHorizontal: 40,
        paddingVertical: 40,
    },
    greeting: { fontSize: 32, fontWeight: '700', color: '#303030', marginBottom: 6 },
    subtitle: { fontSize: 17, color: '#FFF' },
    page: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 40,
        paddingTop: 32,
    },
    grid: {
        flexDirection: 'row',
        gap: 32,
    },
    leftCol: { flex: 2, gap: 24 },
    rightCol: { flex: 1, gap: 12 },
    statsRow: { flexDirection: 'row', gap: 16 },
    statCard: {
        flex: 1,
        backgroundColor: '#303030',
        borderRadius: 14,
        padding: 20,
        alignItems: 'center',
    },
    statValue: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 10 },
    statLabel: { fontSize: 12, color: '#FFF', marginTop: 2 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
    actionsGrid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
    actionCard: {
        flex: 1,
        minWidth: 200,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        transitionProperty: 'transform, box-shadow' as any,
        transitionDuration: '150ms' as any,
    },
    actionCardHovered: {
        transform: [{ translateY: -3 }],
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)' as any,
        borderColor: '#D1D5DB',
    },
    actionTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
    actionSubtitle: { fontSize: 13, color: '#9CA3AF' },
    activityList: { gap: 10 },
    activityCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    activityText: { fontSize: 13, color: '#1A1A2E', fontWeight: '500', flex: 1 },
    activityTime: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginLeft: 30 },
    emptyActivity: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    emptyText: { fontSize: 14, color: '#9CA3AF' },
});