import { Platform } from 'react-native';

/**
 * Provides a function to obtain the user's current geographic location,
 * with support for both web and mobile platforms.
 *
 * - On web platforms, it uses the Browser Geolocation API to retrieve the location.
 * - On mobile platforms, it utilizes the expo-location library for location access.
 *
 * @constant
 * @function
 * @returns {Function} A function that resolves the user's current location as an object containing latitude and longitude.
 */
export const useLocation = () => {
    const getMobileLocation = async () => {
        // expo-location code
    };

    const getWebLocation = async () => {
        // Browser geolocation API
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition((pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
            });
        });
    };

    return Platform.OS === 'web' ? getWebLocation : getMobileLocation;
};