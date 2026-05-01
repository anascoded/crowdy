import { Place } from '@/types';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

console.log('Google API Key:', GOOGLE_API_KEY ? 'loaded' : 'NOT loaded');

/**
 * Service for interacting with the Google Places API to search, retrieve nearby locations,
 * and fetch place details.
 */
const placesService = {
  search: async (query: string): Promise<Place[]> => {
    if (!query.trim()) return [];

    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      console.log('Searching places with query:', query);

      const response = await fetch(url);
      const data = await response.json();

      console.log('Google Places response:', data);

      if (!data.results) {
        console.log('No results in response');
        return [];
      }

      return data.results.map((result: any) => ({
        id: result.place_id,
        name: result.name,
        address: result.formatted_address,
        category: result.types?.[0]?.replace(/_/g, ' ') ?? 'Place',
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        rating: result.rating,
        photoUrl: result.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
            : undefined,
      }));
    } catch (err: any) {
      console.error('Search error:', err);
      throw new Error('Failed to search places');
    }
  },

  /**
   * Fetches a list of nearby places based on the specified latitude and longitude.
   *
   * @param {number} lat - The latitude of the location to search nearby places for.
   * @param {number} lng - The longitude of the location to search nearby places for.
   * @returns {Promise<Place[]>} A promise that resolves to an array of nearby places.
   * Each place includes details such as id, name, address, category, location, rating, and photoUrl.
   * If no results are found, an empty array is returned.
   * @throws {Error} Throws an error if the request to fetch nearby places fails.
   */
  getNearby: async (lat: number, lng: number): Promise<Place[]> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&key=${GOOGLE_API_KEY}`;
      console.log('Fetching nearby places');

      const response = await fetch(url);
      const data = await response.json();

      console.log('Nearby places response:', data);

      if (!data.results) return [];

      return data.results.map((result: any) => ({
        id: result.place_id,
        name: result.name,
        address: result.vicinity,
        category: result.types?.[0]?.replace(/_/g, ' ') ?? 'Place',
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        rating: result.rating,
        photoUrl: result.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
            : undefined,
      }));
    } catch (err: any) {
      console.error('Nearby error:', err);
      throw new Error('Failed to load nearby places');
    }
  },

  /**
   * Fetches and returns the details of a place using the Google Places API.
   *
   * @param {string} placeId - The unique identifier of the place to retrieve details for.
   * @returns {Promise<Place>} A promise that resolves to a Place object containing details about the specified place.
   * @throws {Error} Throws an error if the place details could not be fetched.
   */
  getById: async (placeId: string): Promise<Place> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
      console.log('Fetching place details for:', placeId);

      const response = await fetch(url);
      const data = await response.json();

      console.log('Place details response:', data);

      const result = data.result;

      return {
        id: result.place_id,
        name: result.name,
        address: result.formatted_address,
        category: result.types?.[0]?.replace(/_/g, ' ') ?? 'Place',
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        rating: result.rating,
        photoUrl: result.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
            : undefined,
      };
    } catch (err: any) {
      console.error('Details error:', err);
      throw new Error('Failed to load place details');
    }
  },
};

export { placesService };