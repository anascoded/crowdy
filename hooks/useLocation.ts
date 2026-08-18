import { Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { placesService } from '@/services/placesService';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

const STORAGE_KEY = 'crowdy_default_location';

// Boston, MA — matches the hardcoded default city shown in
// profile-settings/location.tsx before a user has saved their own preference.
// Used as the last-resort fallback if GPS is unavailable/denied AND no saved
// default location exists (or can't be resolved to coordinates).
const FALLBACK_COORDS: Coordinates = { latitude: 42.3601, longitude: -71.0589 };

/**
 * Resolves the user's saved default location (set in profile-settings) into
 * coordinates via a Places text search, falling back to Boston if nothing is
 * saved or the lookup fails.
 *
 * Note: on web this still depends on placesService, which currently hits a
 * CORS wall calling Google Places directly from the browser — see the
 * separate proxy/backend discussion. Until that's resolved, this fallback
 * will itself fail on web and drop through to FALLBACK_COORDS.
 */
const getSavedLocationCoords = async (): Promise<Coordinates> => {
    try {
        const savedCity = await AsyncStorage.getItem(STORAGE_KEY);
        if (!savedCity) return FALLBACK_COORDS;

        const results = await placesService.search(savedCity);
        const first = results[0];
        if (!first) return FALLBACK_COORDS;

        return { latitude: first.location.lat, longitude: first.location.lng };
    } catch (err) {
        console.error('Failed to resolve saved default location:', err);
        return FALLBACK_COORDS;
    }
};

/**
 * Provides a function to obtain the user's current geographic location, with
 * a fallback chain: real GPS first, then the user's saved default location
 * (from profile-settings), then a hardcoded fallback if neither is available.
 *
 * - On web: Browser Geolocation API, falling back on denial/error.
 * - On mobile: expo-location, falling back on denied permission or error.
 */
export const useLocation = () => {
    const getMobileLocation = async (): Promise<Coordinates> => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return getSavedLocationCoords();
            }

            const position = await Location.getCurrentPositionAsync({});
            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
        } catch (err) {
            console.error('Failed to get mobile location:', err);
            return getSavedLocationCoords();
        }
    };

    const getWebLocation = async (): Promise<Coordinates> => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            return getSavedLocationCoords();
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                },
                async () => {
                    // Permission denied or unavailable — previously had no error
                    // callback at all, which left this promise hanging forever.
                    resolve(await getSavedLocationCoords());
                }
            );
        });
    };

    return Platform.OS === 'web' ? getWebLocation : getMobileLocation;
};