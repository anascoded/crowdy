import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Favorite, Place } from '@/types';

/**
 * Represents the state and operations related to user favorites.
 */
interface FavoritesState {
  favorites: Favorite[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  fetchFavorites: () => Promise<void>;
  addFavorite: (place: Place) => Promise<void>;
  removeFavorite: (placeId: string) => Promise<void>;
  isFavorite: (placeId: string) => boolean;
  clearFavorites: () => void;
}

/**
 * A Zustand store for managing favorites functionality, including adding, removing, and syncing favorite places.
 *
 * This store provides state management and utility functions for working with a list of favorite places.
 * It persists the favorite data to storage, handles optimistic updates, and integrates with a backend service.
 *
 * State Properties:
 * - `favorites`: An array of favorite items.
 * - `isLoading`: A boolean indicating whether the favorites are being loaded from a backend.
 * - `isSyncing`: A boolean indicating whether a sync operation (add/remove) is in progress.
 * - `error`: A string or null specifying an error message if an operation fails.
 *
 * Actions:
 * - `fetchFavorites`: Fetches favorites from the backend service and updates the store. Handles loading and error states.
 * - `addFavorite(place)`: Adds a place to the favorites, using optimistic updates. Syncs with the backend service.
 * - `removeFavorite(placeId)`: Removes a place from the favorites, using optimistic updates. Syncs with the backend service.
 * - `isFavorite(placeId)`: Checks if a specific place is in the list of favorites.
 * - `clearFavorites`: Clears all favorite items from the store.
 *
 * Persistence:
 * - The store state is persisted locally using AsyncStorage under the key `favorites-storage`.
 * - Only the `favorites` array is persisted to storage.
 */
const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
          favorites: [],
          isLoading: false,
          isSyncing: false,
          error: null,

            fetchFavorites: async () => {
                set({ isLoading: true, error: null });

                try {
                    const stored = await AsyncStorage.getItem('crowdy_favorites');

                    if (stored) {
                        const favorites = JSON.parse(stored);
                        console.log('Loaded favorites:', favorites);
                        set({ favorites, isLoading: false });
                    } else {
                        console.log('No favorites found');
                        set({ favorites: [], isLoading: false });
                    }
                } catch (err: any) {
                    console.error('Failed to fetch favorites:', err);
                    set({
                        error: err.message ?? 'Failed to load favorites',
                        isLoading: false,
                    });
                }
            },

            addFavorite: async (place: Place) => {
                const optimistic: Favorite = {
                    id: `fav-${place.id}`,
                    userId: 'local-user',
                    place,
                    addedAt: new Date().toISOString(),
                };
                set((state) => ({ favorites: [optimistic, ...state.favorites], isSyncing: true }));

                try {
                    const current = get().favorites;
                    await AsyncStorage.setItem('crowdy_favorites', JSON.stringify(current));
                    console.log('Added favorite:', optimistic);

                    // Log activity
                    const stored = await AsyncStorage.getItem('crowdy_activities') || '[]';
                    const activities = JSON.parse(stored);
                    const newActivity = {
                        id: Date.now().toString(),
                        type: 'favorite_added',
                        placeName: place.name,
                        timestamp: new Date().toISOString(),
                    };
                    const updatedActivities = [newActivity, ...activities].slice(0, 10);
                    await AsyncStorage.setItem('crowdy_activities', JSON.stringify(updatedActivities));

                    set({ isSyncing: false });
                } catch (err: any) {
                    set((state) => ({
                        favorites: state.favorites.filter((f) => f.id !== optimistic.id),
                        error: err.message ?? 'Failed to add favorite',
                        isSyncing: false,
                    }));
                }
            },

          removeFavorite: async (placeId: string) => {
            const previous = get().favorites;
            set((state) => ({
              favorites: state.favorites.filter((f) => f.place.id !== placeId),
              isSyncing: true,
            }));

            try {
              const { favoritesService } = await import('@/services/favoritesService');
              await favoritesService.remove(placeId);
              set({ isSyncing: false });
            } catch (err: any) {
              set({ favorites: previous, error: err.message ?? 'Failed to remove favorite', isSyncing: false });
            }
          },

          isFavorite: (placeId: string) => get().favorites.some((f) => f.place.id === placeId),

          clearFavorites: () => set({ favorites: [], error: null }),
        }),

        {
          name: 'favorites-storage',
          storage: createJSONStorage(() => AsyncStorage),
          partialize: (state) => ({ favorites: state.favorites }),
        },
    ),
);

export default useFavoritesStore;