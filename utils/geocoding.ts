import { placesService } from '@/services/placesService';

export const geocodeLocation = async (locationName: string) => {
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