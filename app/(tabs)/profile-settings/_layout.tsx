import { Stack } from 'expo-router';

export default function ProfileSettingsLayout() {
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