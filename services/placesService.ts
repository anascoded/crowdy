import { Place } from '@/types';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

console.log('Google API Key:', GOOGLE_API_KEY ? 'loaded' : 'NOT loaded');

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