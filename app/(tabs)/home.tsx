import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '@/store/authStore';
import useFavoritesStore from '@/store/favoritesStore';
import {getFirstName} from "@/utils";

export default function HomeScreen() {
    const { user } = useAuthStore();
    const { favorites } = useFavoritesStore();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>
                    Howdy, {getFirstName(user?.displayName)}!
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
                    <Text style={styles.statValue}>42</Text>
                    <Text style={styles.statLabel}>Visited</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="star" size={24} color="#F59E0B" />
                    <Text style={styles.statValue}>4.8</Text>
                    <Text style={styles.statLabel}>Avg Rating</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push('/(tabs)/explore')}
                    activeOpacity={0.85}
                >
                    <Ionicons name="map-outline" size={24} color="#814141" />
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Explore Places</Text>
                        <Text style={styles.actionSubtitle}>Find new places to visit</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push('/(tabs)/favorites')}
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
                <View style={styles.activityCard}>
                    <Text style={styles.activityText}>
                        You saved Central Park to favorites
                    </Text>
                    <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
                <View style={styles.activityCard}>
                    <Text style={styles.activityText}>
                        Times Square is currently busy
                    </Text>
                    <Text style={styles.activityTime}>1 hour ago</Text>
                </View>
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
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    activityText: {
        fontSize: 14,
        color: '#1A1A2E',
        fontWeight: '500',
    },
    activityTime: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
});