import AsyncStorage from '@react-native-async-storage/async-storage';
import { Favorite, Place } from '@/types';

const FAVORITES_KEY = 'crowdy_favorites';

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