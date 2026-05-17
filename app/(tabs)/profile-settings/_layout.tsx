import { Stack } from 'expo-router';
import {JSX} from "react";

/**
 * Renders the ProfileSettingsLayout component, which defines a stack navigator
 * with various screens for managing user profile settings.
 *
 * @return {JSX.Element} The stack navigator containing multiple profile settings-related screens.
 */
export default function ProfileSettingsLayout(): JSX.Element {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="appearance" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="location" />
            <Stack.Screen name="change-password" />
        </Stack>
    );
}