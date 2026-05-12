import { Place } from '@/types';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Handles the status of a response object, particularly for API responses.
 *
 * This function evaluates the status property of the input data. If the status
 * is neither 'OK' nor 'ZERO_RESULTS', it logs the error details to the console
 * and throws an exception with the error message or status code.
 *
 * @param {any} data - The response data object containing a status property and
 *                     an optional error_message property.
 * @throws {Error} Throws an error with a message derived from the input data if
 *                 the status is not 'OK' or 'ZERO_RESULTS'.
 */
const handleStatus = (data: any) => {
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error('Google API Error:', data.status, data.error_message);
    throw new Error(data.error_message || data.status);
  }
};

/**
 * Maps a raw result object to a 'Place' object.
 *
 * @param {any} result - The raw data object, typically from an API response, containing information about a place.
 * @returns {Place} A formatted 'Place' object with essential information such as id, name, address, category, location, rating, and photo URL.
 */
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

/**
 * An object that provides methods for interacting with the Google Places API.
 * This service includes functionalities for autocompleting place names, retrieving
 * detailed information about a specific place, fetching nearby places based on
 * location, and performing general text-based searches for places.
 */
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

  /**
   * Retrieves details of a place based on the provided place ID.
   *
   * @param {string} placeId - The unique identifier of the place to be retrieved.
   *                             Must be a non-empty string with a minimum length of 10 characters.
   * @returns {Promise<Place>} A promise that resolves to a Place object containing the
   *                           details of the requested place, such as name, rating, address,
   *                           geometry, photos, and types.
   * @throws {Error} If the place ID is invalid, the place is not found, or there is an issue
   *                 with the request.
   */
  getById: async (placeId: string): Promise<Place> => {
    if (
        !placeId ||
        typeof placeId !== 'string' ||
        placeId.trim().length < 10
    ) {
      throw new Error('Invalid place ID');
    }

    // Remove the fields parameter or add place_id to it
    const url = `${BASE_URL}/details/json?place_id=${placeId}&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    handleStatus(data);

    if (!data.result) {
      throw new Error('Place not found');
    }

    // Manually add the place_id since we know it
    const result = {
      ...data.result,
      place_id: placeId,  // ← Add this
    };

    return mapToPlace(result);
  },

  /**
   * Fetches nearby places of a specified type within a 1500-meter radius from the given latitude and longitude.
   *
   * @param {number} lat - The latitude of the location to search nearby.
   * @param {number} lng - The longitude of the location to search nearby.
   * @param {string} [type='restaurant'] - The type of place to search for. Defaults to 'restaurant' if not provided.
   * @returns {Promise<Place[]>} A promise that resolves to a list of nearby places mapped to the `Place` type.
   * @throws Will throw an error if the API response status indicates an unsuccessful request.
   */
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

  /**
   * Performs a search query to fetch a list of places based on the given input string.
   *
   * This function interacts with an external API to retrieve location-related data.
   * If the query string is empty or contains only whitespace, an empty array is returned.
   * The function handles the API's response, mapping the results into a list of Place objects.
   *
   * @param {string} query - The search term to query for places.
   * @returns {Promise<Place[]>} A promise that resolves to an array of Place objects.
   * @throws {Error} Throws an error if the API response indicates a failure or unexpected status.
   */
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