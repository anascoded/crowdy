import { Place } from '@/types';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

const handleStatus = (data: any) => {
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error('Google API Error:', data.status, data.error_message);
    throw new Error(data.error_message || data.status);
  }
};

const mapToPlace = (result: any): Place => ({
  id: result.place_id,
  name: result.name,
  address: result.formatted_address || result.vicinity,
  category: result.types?.[0]?.replace(/_/g, ' ') ?? 'Place',
  location: {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  },
  rating: result.rating,
  photoUrl: result.photos?.[0]
      ? `${BASE_URL}/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${API_KEY}`
      : undefined,
});

export const placesService = {
  // 🔍 AUTOCOMPLETE (better than textsearch)
  autocomplete: async (input: string) => {
    if (!input.trim()) return [];

    const url = `${BASE_URL}/autocomplete/json?input=${encodeURIComponent(
        input
    )}&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    handleStatus(data);

    return data.predictions.map((p: any) => ({
      description: p.description,
      placeId: p.place_id,
    }));
  },

  // 📍 DETAILS (used after autocomplete)
  getById: async (placeId: string): Promise<Place> => {
    if (
        !placeId ||
        typeof placeId !== 'string' ||
        placeId.trim().length < 10
    ) {
      throw new Error('Invalid place ID');
    }

    const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=name,rating,formatted_address,geometry,photos,types&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    handleStatus(data);

    if (!data.result) {
      throw new Error('Place not found');
    }

    return mapToPlace(data.result);
  },

  // 📌 NEARBY (more controlled)
  getNearby: async (
      lat: number,
      lng: number,
      type: string = 'restaurant'
  ): Promise<Place[]> => {
    const url = `${BASE_URL}/nearbysearch/json?location=${lat},${lng}&radius=1500&type=${type}&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    handleStatus(data);

    return data.results.map(mapToPlace);
  },

  // 🔎 FALLBACK SEARCH (if needed)
  search: async (query: string): Promise<Place[]> => {
    if (!query.trim()) return [];

    const url = `${BASE_URL}/textsearch/json?query=${encodeURIComponent(
        query
    )}&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    handleStatus(data);

    return data.results.map(mapToPlace);
  },
};