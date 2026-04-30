import { Place } from "@/types";
import { create } from "zustand";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlacesState {
  // Search
  query: string;
  results: Place[];
  isSearching: boolean;
  searchError: string | null;

  // Selected place
  selectedPlace: Place | null;

  // Nearby places (shown on map on load)
  nearbyPlaces: Place[];
  isLoadingNearby: boolean;
  nearbyError: string | null;

  // Actions
  setQuery: (query: string) => void;
  searchPlaces: (query: string) => Promise<void>;
  clearSearch: () => void;
  setSelectedPlace: (place: Place | null) => void;
  fetchNearbyPlaces: (lat: number, lng: number) => Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const usePlacesStore = create<PlacesState>()((set) => ({
  query: "",
  results: [],
  isSearching: false,
  searchError: null,

  selectedPlace: null,

  nearbyPlaces: [],
  isLoadingNearby: false,
  nearbyError: null,

  // ── Search ─────────────────────────────────────────────────────────────────
  setQuery: (query: string) => set({ query }),

  searchPlaces: async (query: string) => {
    if (!query.trim()) {
      set({ results: [], searchError: null });
      return;
    }

    set({ isSearching: true, searchError: null });
    try {
      const { placesService } = await import("@/services/placesService");
      const results = await placesService.search(query);
      set({ results, isSearching: false });
    } catch (err: any) {
      set({ searchError: err.message ?? "Search failed", isSearching: false });
    }
  },

  clearSearch: () => set({ query: "", results: [], searchError: null }),

  // ── Selected place ─────────────────────────────────────────────────────────
  setSelectedPlace: (place: Place | null) => set({ selectedPlace: place }),

  // ── Nearby ─────────────────────────────────────────────────────────────────
  fetchNearbyPlaces: async (lat: number, lng: number) => {
    set({ isLoadingNearby: true, nearbyError: null });
    try {
      const { placesService } = await import("@/services/placesService");
      const nearbyPlaces = await placesService.getNearby(lat, lng);
      set({ nearbyPlaces, isLoadingNearby: false });
    } catch (err: any) {
      set({
        nearbyError: err.message ?? "Failed to load nearby places",
        isLoadingNearby: false,
      });
    }
  },
}));

export default usePlacesStore;
