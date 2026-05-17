// app/(auth)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Structural layout wrapper for the authentication route group.
 * Sets unified transition options and handles stack architecture
 * for login, registration, and confirmation screens.
 */
export default function AuthLayout() {
    return (
        <>
            {/* Ensures light text/icons on modern dark headers or backgrounds */}
            <StatusBar style="dark" />

            <Stack
                screenOptions={{
                    headerShown: false, // Hides native headers to allow custom-designed app layouts
                    contentStyle: { backgroundColor: '#FFFFFF' },
                    animation: 'slide_from_right', // Clean modern slide transitions across screens
                }}
            >
                {/* Explicitly mapping screens ensures correct structural fallback tracking */}
                <Stack.Screen
                    name="sign-in"
                    options={{ title: 'Sign In' }}
                />
                <Stack.Screen
                    name="sign-up"
                    options={{ title: 'Create Account' }}
                />
                <Stack.Screen
                    name="verify"
                    options={{
                        title: 'Verify Account',
                        gestureEnabled: false // Prevents swiping back mid-MFA flow
                    }}
                />
            </Stack>
        </>
    );
}