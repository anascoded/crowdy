import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
    const openLink = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>About Crowdy</Text>
            </View>

            {/* Logo Section */}
            <View style={styles.logoSection}>
                <View style={styles.logoBadge}>
                    <Ionicons name="people" size={48} color="#814141" />
                </View>
                <Text style={styles.appName}>Crowdy</Text>
                <Text style={styles.version}>Version 1.0.0</Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>What is Crowdy?</Text>
                <Text style={styles.description}>
                    Crowdy is your personal guide to discovering and tracking crowd levels at your favorite places in real-time. Never waste time waiting in crowded venues again!
                </Text>
            </View>

            {/* Features */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Features</Text>
                <View style={styles.featureList}>
                    <FeatureItem
                        icon="map-outline"
                        title="Explore Places"
                        description="Search and discover thousands of venues"
                    />
                    <FeatureItem
                        icon="pulse"
                        title="Live Crowd Data"
                        description="Real-time busyness levels updated constantly"
                    />
                    <FeatureItem
                        icon="heart-outline"
                        title="Save Favorites"
                        description="Keep track of your favorite places"
                    />
                    <FeatureItem
                        icon="bar-chart-outline"
                        title="7-Day History"
                        description="View hourly crowd patterns for the past week"
                    />
                </View>
            </View>

            {/* Mission */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Our Mission</Text>
                <Text style={styles.description}>
                    We believe everyone deserves to enjoy their favorite places without the stress of unexpected crowds. Crowdy empowers you to make informed decisions about when and where to visit, helping you maximize your leisure time.
                </Text>
            </View>

            {/* Contact & Social */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Get in Touch</Text>
                <View style={styles.contactList}>
                    <ContactItem
                        icon="mail-outline"
                        label="Email"
                        value="support@crowdy.co"
                        onPress={() => openLink('mailto:support@crowdy.app')}
                    />
                    <ContactItem
                        icon="globe-outline"
                        label="Website"
                        value="www.crowdy.co"
                        onPress={() => openLink('https://www.crowdy.app')}
                    />
                    <ContactItem
                        icon="logo-twitter"
                        label="X"
                        value="@CrowdyApp"
                        onPress={() => openLink('https://twitter.com/CrowdyApp')}
                    />
                </View>
            </View>

            {/* Credits */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Built With</Text>
                <Text style={styles.description}>
                    Crowdy is built with React Native, Expo, Firebase, and powered by Google Places API and crowd data providers.
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    © 2026 Crowdy. All rights reserved.
                </Text>
            </View>
        </ScrollView>
    );
}

interface FeatureItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIcon}>
            <Ionicons name={icon} size={24} color="#814141" />
        </View>
        <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

interface ContactItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    onPress: () => void;
}

const ContactItem = ({ icon, label, value, onPress }: ContactItemProps) => (
    <TouchableOpacity
        style={styles.contactItem}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Ionicons name={icon} size={20} color="#814141" />
        <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>{label}</Text>
            <Text style={styles.contactValue}>{value}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingBottom: 48,
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A2E',
    },
    logoSection: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
    },
    logoBadge: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#EDE9FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 4,
    },
    version: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 22,
    },
    featureList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#EDE9FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A2E',
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    contactList: {
        gap: 12,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    contactContent: {
        flex: 1,
        marginLeft: 12,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    contactValue: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 24,
        marginTop: 24,
        borderTopWidth: 0.5,
        borderTopColor: '#E5E7EB',
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});