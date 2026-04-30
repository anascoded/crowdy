import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Favorite, Place } from '@/types';

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
              const { favoritesService } = await import('@/services/favoritesService');
              const favorites = await favoritesService.getAll();
              set({ favorites, isLoading: false });
            } catch (err: any) {
              set({ error: err.message ?? 'Failed to load favorites', isLoading: false });
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
              const { favoritesService } = await import('@/services/favoritesService');
              await favoritesService.add(place);
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