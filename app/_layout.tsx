import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SplashScreen } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import queryClient from '@/lib/queryClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    useEffect(() => {
        // Hide splash screen after a short delay
        const timer = setTimeout(() => {
            SplashScreen.hideAsync();
        }, 3000); // Show splash for 3 seconds

        return () => clearTimeout(timer);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="place/[id]"
                    options={{
                        headerShown: true,
                        headerTitle: '',
                        headerBackTitle: 'Back',
                    }}
                />
                <Stack.Screen
                    name="screens/about"
                    options={{
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
            </Stack>
        </QueryClientProvider>
    );
}