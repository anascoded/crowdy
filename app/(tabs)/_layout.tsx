import { Tabs, router } from 'expo-router';
import { JSX, useEffect } from 'react';
import { Platform } from 'react-native';
import { Home, Map, Heart, User } from 'lucide-react-native';
import { useAuthStore } from "@/store/authStore";

interface TabIconProps {
    color: string;
    size: number;
    name: 'home' | 'explore' | 'favorites' | 'profile';
}

const TabIcon = ({ name, color, size }: TabIconProps) => {
    switch (name) {
        case 'home':
            return <Home color={color} size={size} />;
        case 'explore':
            return <Map color={color} size={size} />;
        case 'favorites':
            return <Heart color={color} size={size} fill={color} />;
        case 'profile':
            return <User color={color} size={size} />;
        default:
            return null;
    }
};

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
                tabBarActiveTintColor: '#5C4033',
                tabBarInactiveTintColor: '#9E9E9E',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0.5,
                    borderTopColor: '#E0E0E0',
                    height: Platform.OS === 'ios' ? 88 : 88,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 28,
                    paddingTop: 8,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="home" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="explore" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favorites',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="favorites" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile-settings"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="profile" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}