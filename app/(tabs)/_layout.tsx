import { Tabs, router } from 'expo-router';
import { JSX, useEffect } from 'react';
import {Platform, View} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from "@/store/authStore";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
    name: IoniconName;
    color: string;
    size: number;
    focused?: boolean;
}

/**
 * TabIcon Component
 *
 * A functional component that renders an icon using the Ionicons library.
 *
 * @param {Object} props - The properties passed to the TabIcon component.
 * @param {string} props.name - The name of the icon to be displayed.
 * @param {string} props.color - The color of the icon.
 * @param {number} props.size - The size of the icon.
 *
 * @returns {JSX.Element} The rendered Ionicons component with the specified properties.
 */
const TabIcon = ({ name, color, size, focused }: TabIconProps): JSX.Element => (
    <View style={[
        {
            width: 70,
            height: 40,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        focused && {
            backgroundColor: '#FAD341',
        }
    ]}>
        <Ionicons name={name} color={color} size={size} />
    </View>
);

/**
 * Renders a tab-based navigation layout using the `Tabs` component.
 * The layout includes multiple screens with individual configurations, styling, and icons.
 * It ensures user authentication by redirecting unauthenticated users to the sign-in page.
 *
 * @return {JSX.Element} The rendered JSX element for the tab-based navigation layout.
 */
export default function TabsLayout(): JSX.Element {
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/(auth)/sign-in');
        }
    }, [isAuthenticated]);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#303030',
                tabBarInactiveTintColor: '#9E9E9E',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0.5,
                    borderTopColor: '#E0E0E0',
                    height: Platform.OS === 'ios' ? 88 : 88,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 28,
                    paddingTop: 14,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                },
                tabBarItemStyle: {
                    //paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                    paddingBottom: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon name="home" color={color} size={size} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon name="map" color={color} size={size} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favorites',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon name="heart" color={color} size={size} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile-settings"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="person-circle-outline" color={color} size={30} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="events"
                options={{
                    href: null,
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}