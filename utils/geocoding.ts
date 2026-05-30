import { placesService } from '@/services/placesService';

/**
 * Fetches the geographical coordinates of a given location name.
 *
 * This asynchronous function uses a place search service to retrieve
 * geolocation data for the specified location name. If matching results are found,
 * it returns the location data of the first result. If no results are found
 * or an error occurs during the process, it returns null.
 *
 * @param {string} locationName - The name of the location to geocode.
 * @returns {Promise<Object|null>} A promise that resolves to the location
 * object containing geographic coordinates, or null if no results are found
 * or an error occurs.
 */
export const geocodeLocation = async (locationName: string): Promise<object | null> => {
    try {
        const results = await placesService.search(locationName);
        if (results.length > 0) {
            return results[0].location;
        }
        return null;
    } catch (err) {
        console.error('Geocoding error:', err);
        return null;
    }
};