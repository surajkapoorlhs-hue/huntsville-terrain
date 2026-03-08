import { create } from "zustand";
import type { CuratedPlaceId } from "../data/curatedPlaces";
import {
  DEFAULT_MAP_MODE,
  DEFAULT_REFERENCE_STYLE
} from "../map/huntsvilleMapConfig";
import type { MapMode, ReferenceStyle } from "../map/mapModes";

export const SAVED_HOMES_STORAGE_KEY = "huntsville-terrain.saved-homes";

export type SavedHome = {
  id: string;
  label: string;
  address: string;
  coordinates: [number, number];
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function isSavedHome(value: unknown): value is SavedHome {
  if (!value || typeof value !== "object") {
    return false;
  }

  const home = value as Partial<SavedHome>;
  return (
    typeof home.id === "string" &&
    typeof home.label === "string" &&
    typeof home.address === "string" &&
    Array.isArray(home.coordinates) &&
    home.coordinates.length === 2 &&
    home.coordinates.every((entry) => typeof entry === "number")
  );
}

function readSavedHomes(storage: StorageLike | null): SavedHome[] {
  const raw = storage?.getItem(SAVED_HOMES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedHome) : [];
  } catch {
    return [];
  }
}

function writeSavedHomes(storage: StorageLike | null, homes: SavedHome[]) {
  if (!storage) {
    return;
  }

  storage.setItem(SAVED_HOMES_STORAGE_KEY, JSON.stringify(homes));
}

type MapUiState = {
  selectedPlaceId: CuratedPlaceId | null;
  selectedHomeId: string | null;
  savedHomes: SavedHome[];
  mapMode: MapMode;
  referenceStyle: ReferenceStyle;
  overlays: {
    streams: boolean;
    parks: boolean;
    sites: boolean;
    trails: boolean;
  };
  selectPlace: (placeId: CuratedPlaceId) => void;
  selectHome: (homeId: string) => void;
  clearSelection: () => void;
  addSavedHome: (home: SavedHome) => void;
  removeSavedHome: (homeId: string) => void;
  hydrateSavedHomes: () => void;
  setMapMode: (mode: MapMode) => void;
  setReferenceStyle: (style: ReferenceStyle) => void;
  toggleOverlay: (overlay: "streams" | "parks" | "sites" | "trails") => void;
};

export const createMapUiStore = (options: { storage?: StorageLike | null } = {}) =>
  create<MapUiState>((set) => ({
    selectedPlaceId: null,
    selectedHomeId: null,
    savedHomes: [],
    mapMode: DEFAULT_MAP_MODE,
    referenceStyle: DEFAULT_REFERENCE_STYLE,
    overlays: {
      streams: true,
      parks: true,
      sites: true,
      trails: false
    },
    selectPlace: (placeId) => {
      set({ selectedPlaceId: placeId, selectedHomeId: null });
    },
    selectHome: (homeId) => {
      set({ selectedPlaceId: null, selectedHomeId: homeId });
    },
    clearSelection: () => {
      set({ selectedPlaceId: null, selectedHomeId: null });
    },
    addSavedHome: (home) => {
      set((state) => {
        const dedupedHomes = state.savedHomes.filter(
          (savedHome) =>
            savedHome.id !== home.id &&
            savedHome.address.toLowerCase() !== home.address.toLowerCase()
        );
        const savedHomes = [...dedupedHomes, home];
        writeSavedHomes(options.storage ?? getDefaultStorage(), savedHomes);
        return {
          savedHomes,
          selectedPlaceId: null,
          selectedHomeId: home.id
        };
      });
    },
    removeSavedHome: (homeId) => {
      set((state) => {
        const savedHomes = state.savedHomes.filter((home) => home.id !== homeId);
        writeSavedHomes(options.storage ?? getDefaultStorage(), savedHomes);
        return {
          savedHomes,
          selectedHomeId:
            state.selectedHomeId === homeId ? null : state.selectedHomeId
        };
      });
    },
    hydrateSavedHomes: () => {
      set(() => ({
        savedHomes: readSavedHomes(options.storage ?? getDefaultStorage())
      }));
    },
    setMapMode: (mode) => {
      set({ mapMode: mode });
    },
    setReferenceStyle: (style) => {
      set({ referenceStyle: style });
    },
    toggleOverlay: (overlay) => {
      set((state) => ({
        overlays: {
          ...state.overlays,
          [overlay]: !state.overlays[overlay]
        }
      }));
    }
  }));

export const useMapUiStore = createMapUiStore();
