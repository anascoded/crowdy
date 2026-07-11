import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

// Use these for web-specific logic
export const getMapLink = (lat: number, lng: number) => {
    if (isWeb) {
        return `https://maps.google.com/?q=${lat},${lng}`;
    }
    // Mobile fallback handled in component
};