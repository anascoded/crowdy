import { Stack } from 'expo-router';
import {JSX} from "react";

/**
 * AuthLayout is a functional component that sets up a navigation stack
 * for authentication-related screens. It includes routes for "sign-in"
 * and "sign-up" screens with the header hidden by default.
 *
 * @return {JSX.Element} A navigation stack containing the authentication screens.
 */
export default function AuthLayout(): JSX.Element {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
        </Stack>
    );
}