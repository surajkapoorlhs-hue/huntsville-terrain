import { describe, expect, it } from "vitest";
import {
  SAVED_HOMES_STORAGE_KEY,
  createMapUiStore
} from "../../src/store/mapUiStore";

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    }
  };
}

describe("map ui store", () => {
  it("tracks curated places, map mode, and saved homes", () => {
    const storage = createMemoryStorage();
    const store = createMapUiStore({ storage });

    expect(store.getState().mapMode).toBe("terrain");
    expect(store.getState().referenceStyle).toBe("civic-atlas");
    expect(store.getState().overlays.streams).toBe(true);
    expect(store.getState().overlays.parks).toBe(true);
    expect(store.getState().overlays.sites).toBe(true);
    expect(store.getState().overlays.trails).toBe(false);

    store.getState().selectPlace("monte-sano-state-park");
    expect(store.getState().selectedPlaceId).toBe("monte-sano-state-park");

    store.getState().setMapMode("terrain");
    expect(store.getState().mapMode).toBe("terrain");

    store.getState().setReferenceStyle("natural-paper");
    expect(store.getState().referenceStyle).toBe("natural-paper");

    store.getState().toggleOverlay("trails");
    expect(store.getState().overlays.trails).toBe(true);

    store.getState().addSavedHome({
      id: "home-1",
      label: "101 Test Street",
      address: "101 Test Street, Huntsville, AL",
      coordinates: [-86.58, 34.73]
    });
    expect(store.getState().savedHomes).toHaveLength(1);
    expect(store.getState().selectedHomeId).toBe("home-1");
    expect(store.getState().selectedPlaceId).toBeNull();
    expect(storage.getItem(SAVED_HOMES_STORAGE_KEY)).toContain("101 Test Street");

    const hydratedStore = createMapUiStore({ storage });
    hydratedStore.getState().hydrateSavedHomes();
    expect(hydratedStore.getState().savedHomes).toHaveLength(1);
    expect(hydratedStore.getState().savedHomes[0]?.id).toBe("home-1");

    hydratedStore.getState().removeSavedHome("home-1");
    expect(hydratedStore.getState().savedHomes).toHaveLength(0);
    expect(storage.getItem(SAVED_HOMES_STORAGE_KEY)).toBe("[]");
  });
});
