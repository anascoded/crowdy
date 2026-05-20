import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    TouchableOpacity,
    Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {JSX} from "react";

/**
 * The `AboutScreen` component represents the "About" page of the application, providing information
 * about the app, its features, mission, and contact details. It allows users to navigate back, view
 * app details, explore functionalities, and access contact and social media links.
 *
 * @return {JSX.Element} Returns a scrollable view containing detailed sections about the application,
 * including its logo, features, mission, contact links, and credits.
 */
export default function AboutScreen(): JSX.Element {
    const router = useRouter();

    /**
     * Asynchronously attempts to open the provided URL using the device's available apps.
     *
     * The function first checks if the URL can be opened by querying the device for a supported handler.
     * If a handler exists, it opens the URL. Otherwise, it alerts the user that the URL type is unsupported.
     *
     * If an error occurs during this process, an error message is logged to the console, and an alert
     * is displayed to inform the user of the failure.
     *
     * @param {string} url - The URL string to open.
     * @throws Will log an error to the console and display an alert if an exception is thrown during execution.
     */
    const openLink = async (url: string) => {
        try {
            // Check if the device has a handler installed capable of parsing this specific URL string
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Invalid Link", `Your device cannot open this type of URL: ${url}`);
            }
        } catch (error) {
            console.error("An error occurred while opening the URL:", error);
            Alert.alert("Error", "Something went wrong trying to open this link.");
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About</Text>
                <View style={styles.spacer} />
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
                        value="support@crowdy.app"
                        onPress={() => openLink('mailto:support@crowdy.app')}
                    />
                    <ContactItem
                        icon="globe-outline"
                        label="Website"
                        value="www.crowdy.app"
                        onPress={() => openLink('https://www.crowdy.app')}
                    />
                    <ContactItem
                        icon="logo-x"
                        label="X"
                        value="@CrowdyApp"
                        onPress={() => openLink('https://x.com/CrowdyApp')}
                    />
                </View>
            </View>

            {/* Credits */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Built With</Text>
                <Text style={styles.description}>
                    Crowdy is built with React Native, Expo, AWS, and powered by Google Places API and crowd data providers.
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    © 2026 Crowdy, Ltd. All rights reserved.
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

/**
 * A functional component that represents a feature item.
 * It displays an icon, a title, and a description, styled properly for visual representation.
 *
 * @param {Object} props - The property object.
 * @param {string} props.icon - The name of the Ionicons icon to be displayed.
 * @param {string} props.title - The title text of the feature item.
 * @param {string} props.description - The descriptive text of the feature item.
 * @returns {JSX.Element} - The rendered feature item component.
 */
const FeatureItem = ({ icon, title, description }: FeatureItemProps): JSX.Element => (
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

/**
 * Represents the properties required for rendering a contact item.
 */
interface ContactItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    onPress: () => void;
}

/**
 * A functional component that renders a clickable contact item.
 * The component displays an icon, a label, and a value, with an optional action
 * triggered when the item is pressed.
 *
 * @param {Object} props - The properties for the ContactItem component.
 * @param {string} props.icon - The name of the icon to be displayed on the contact item.
 * @param {string} props.label - The label text to describe the contact information.
 * @param {string} props.value - The value text representing the contact detail.
 * @param {function} props.onPress - The callback function to be invoked when the item is pressed.
 * @returns {JSX.Element} A TouchableOpacity component styled as a contact item with provided details.
 */
const ContactItem = ({ icon, label, value, onPress }: ContactItemProps): JSX.Element => (
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingTop: Platform.OS === 'ios' ? 60 : 60,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A2E',
        textAlign: 'center',
    },
    spacer: {
        width: 44,
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