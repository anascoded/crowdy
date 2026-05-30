import { Stack } from 'expo-router';
import { Amplify } from 'aws-amplify';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {JSX, useEffect} from 'react';
import outputs from '../amplify_outputs.json';

SplashScreen.preventAutoHideAsync().then(() => {
    // Splash screen prevention initialized
}).catch((err) => {
    console.error('Failed to prevent splash screen:', err);
});

Amplify.configure(outputs);

/**
 * RootLayout is a component responsible for managing the application's root layout and initial setup.
 * It loads custom fonts asynchronously and manages the loading screen display.
 * If fonts are not loaded or if there is an error, it temporarily renders nothing.
 * Once the fonts are loaded or an error occurs, it hides the splash screen and renders the application stack.
 *
 * @return {JSX.Element|null} The root layout of the application as a stack of screens; null if fonts are still loading or an error is yet to occur.
 */
export default function RootLayout(): JSX.Element | null {
    const [fontsLoaded, fontError] = useFonts({
        'Poppins-Regular': require('@react-native-google-fonts/poppins/Poppins_400Regular.ttf'),
        'Poppins-Medium': require('@react-native-google-fonts/poppins/Poppins_500Medium.ttf'),
        'Poppins-SemiBold': require('@react-native-google-fonts/poppins/Poppins_600SemiBold.ttf'),
        'Poppins-Bold': require('@react-native-google-fonts/poppins/Poppins_700Bold.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            const timer = setTimeout(async () => {
                await SplashScreen.hideAsync();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
        </Stack>
    );
}