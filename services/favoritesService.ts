import AsyncStorage from '@react-native-async-storage/async-storage';
import { Favorite, Place } from '@/types';

const FAVORITES_KEY = 'crowdy_favorites';

/**
 * Service for managing user's favorite places.
 *
 * The `favoritesService` object provides methods to interact with the favorites list,
 * including retrieving all favorites, adding a new favorite place, and removing an
 * existing favorite. All operations are persisted using AsyncStorage.
 *
 * @type {{ getAll: () => Promise<Favorite[]>, add: (place: Place) => Promise<Favorite>, remove: (placeId: string) => Promise<void> }}
 */
const favoritesService = {
  getAll: async (): Promise<Favorite[]> => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Failed to get favorites:', err);
      return [];
    }
  },

  /**
   * Adds a new favorite place to the user's favorites list.
   *
   * This function checks if the specified place is already in the favorites list.
   * If the place is already a favorite, the existing favorite is returned.
   * Otherwise, a new favorite is created, added to the list, and persisted.
   *
   * @param {Place} place - The place to be added to the favorites' list.
   * @returns {Promise<Favorite>} A promise that resolves to the added or existing favorite.
   * @throws Will throw an error if the addition process fails.
   */
  add: async (place: Place): Promise<Favorite> => {
    try {
      const favorites = await favoritesService.getAll();

      // Check if already exists
      const exists = favorites.some((f) => f.place.id === place.id);
      if (exists) {
        return favorites.find((f) => f.place.id === place.id)!;
      }

      const favorite: Favorite = {
        id: `fav-${place.id}`,
        userId: 'local-user',
        place,
        addedAt: new Date().toISOString(),
      };

      favorites.push(favorite);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

      console.log('Added favorite:', favorite);
      return favorite;
    } catch (err) {
      console.error('Failed to add favorite:', err);
      throw err;
    }
  },

  /**
   * Removes a favorite place from the stored list of favorites.
   *
   * @param {string} placeId - The unique identifier of the place to be removed.
   * @returns {Promise<void>} A promise that resolves once the place has been successfully removed,
   * or rejects with an error if there was an issue.
   * @throws Will throw an error if removing the favorite fails.
   */
  remove: async (placeId: string): Promise<void> => {
    try {
      const favorites = await favoritesService.getAll();
      const filtered = favorites.filter((f) => f.place.id !== placeId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));

      console.log('Removed favorite:', placeId);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      throw err;
    }
  },
};

export { favoritesService };