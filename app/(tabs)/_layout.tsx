import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '@/store/authStore';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
    name: IoniconName;
    color: string;
    size: number;
}

const TabIcon = ({ name, color, size }: TabIconProps) => (
    <Ionicons name={name} color={color} size={size} />
);

export default function TabsLayout() {
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
                tabBarActiveTintColor: '#F64900',
                tabBarInactiveTintColor: '#9E9E9E',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0.5,
                    borderTopColor: '#E0E0E0',
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
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
                        <TabIcon name="home-outline" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="map-outline" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favorites',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon
                            name={isAuthenticated ? 'heart' : 'heart-outline'}
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon
                            name={isAuthenticated ? 'person' : 'person-outline'}
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}