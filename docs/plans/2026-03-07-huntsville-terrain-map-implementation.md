# Huntsville Terrain Map Implementation Plan

> **Execution:** Use `executing-plans` to implement this plan task-by-task.

**Goal:** Replace the Three.js Huntsville diorama with a shareable, geographically accurate Huntsville-core terrain explorer with tilt, rotate, zoom, and curated natural-site interactions.

**Architecture:** Replace the current scene-first renderer with a `MapLibre GL JS` map shell backed by local terrain/vector asset manifests and a curated natural-sites dataset. Keep map behavior in focused `src/map/*` modules, keep authored place data separate from generated assets, and cover browser behavior with Playwright while keeping Vitest on pure modules.

**Tech Stack:** React 19, Vite, TypeScript, `maplibre-gl`, `zustand`, `yaml`, Vitest, Playwright

---

## Execution Notes

- `huntsville-diorama/` is not currently a git repository, so `using-git-worktrees` is blocked and commit steps cannot run yet.
- Execute this plan in place at `/Users/surajkapoor/AI projects/huntsville-diorama`.
- If the project is initialized as a git repo before implementation, create branch `codex/huntsville-terrain-map` and resume the commit steps as written.
- Vitest is configured for `node`, so unit tests should target pure modules. Browser interaction belongs in Playwright.

### Task 1: Pivot the app identity and dependency baseline

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/App.tsx`
- Modify: `tests/smoke/app-smoke.test.ts`

**Step 1: Write the failing smoke test**

```ts
import { describe, expect, it } from "vitest";
import { getAppTitle } from "../../src/App";

describe("app shell", () => {
  it("exposes the Huntsville terrain explorer title", () => {
    expect(getAppTitle()).toBe("Huntsville Terrain Explorer");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/smoke/app-smoke.test.ts`
Expected: FAIL because the title is still `"Huntsville Living Diorama"`.

**Step 3: Write minimal implementation**

```ts
export function getAppTitle(): string {
  return "Huntsville Terrain Explorer";
}
```

Update the shell copy in `src/App.tsx` to describe the new product and add `maplibre-gl` to `package.json`. Remove `three`, `@react-three/fiber`, `@react-three/drei`, and `@types/three`, then run `npm install` to refresh `package-lock.json`.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/smoke/app-smoke.test.ts`
Expected: PASS.

**Step 5: Snapshot changes**

Run: `git status --short`
Expected: If `.git/` exists later, only the four files above should be staged for this task. If `.git/` still does not exist, record `"git unavailable"` in the execution log and continue.

### Task 2: Define stable Huntsville map config and curated feature data

**Files:**
- Create: `src/map/huntsvilleMapConfig.ts`
- Create: `src/data/naturalSites.ts`
- Test: `tests/unit/map-config.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  HUNTSVILLE_CORE_BOUNDS,
  INITIAL_CAMERA,
  NATURAL_SITE_IDS
} from "../../src/map/huntsvilleMapConfig";

describe("huntsville terrain config", () => {
  it("pins the map to Huntsville core and exposes curated sites", () => {
    expect(HUNTSVILLE_CORE_BOUNDS).toHaveLength(4);
    expect(INITIAL_CAMERA.pitch).toBeGreaterThan(40);
    expect(NATURAL_SITE_IDS).toContain("monte-sano-state-park");
    expect(NATURAL_SITE_IDS.length).toBeGreaterThanOrEqual(5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/map-config.test.ts`
Expected: FAIL with module-not-found errors for the new config/data modules.

**Step 3: Write minimal implementation**

```ts
export const HUNTSVILLE_CORE_BOUNDS = [-86.72, 34.62, -86.43, 34.83] as const;

export const INITIAL_CAMERA = {
  center: [-86.59, 34.73] as const,
  zoom: 11.8,
  pitch: 58,
  bearing: 24
};

export const NATURAL_SITE_IDS = [
  "monte-sano-state-park",
  "monte-sano-nature-preserve",
  "green-mountain-nature-trail",
  "chapman-mountain-nature-preserve",
  "blevins-gap"
];
```

Back the IDs with a typed `FeatureCollection` in `src/data/naturalSites.ts` that includes names, categories, descriptions, and point coordinates.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/map-config.test.ts`
Expected: PASS.

**Step 5: Snapshot changes**

Run: `git status --short`
Expected: If git exists later, only the new `src/map`, `src/data`, and test file should appear for this task. Otherwise log `"git unavailable"`.

### Task 3: Build a pure terrain-style module

**Files:**
- Create: `src/map/buildTerrainStyle.ts`
- Test: `tests/unit/build-terrain-style.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildTerrainStyle } from "../../src/map/buildTerrainStyle";

describe("terrain style builder", () => {
  it("creates terrain, vector, and site sources", () => {
    const style = buildTerrainStyle();
    expect(style.version).toBe(8);
    expect(style.sources.dem.type).toBe("raster-dem");
    expect(style.sources.sites.type).toBe("geojson");
    expect(style.terrain?.source).toBe("dem");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/build-terrain-style.test.ts`
Expected: FAIL because `buildTerrainStyle` does not exist yet.

**Step 3: Write minimal implementation**

```ts
export function buildTerrainStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      dem: {
        type: "raster-dem",
        tiles: ["/generated/terrain/{z}/{x}/{y}.png"],
        tileSize: 256,
        encoding: "terrarium"
      },
      basemap: {
        type: "vector",
        url: "/generated/vectors/huntsville-core.json"
      },
      sites: {
        type: "geojson",
        data: naturalSites
      }
    },
    terrain: {
      source: "dem",
      exaggeration: 1
    },
    layers: []
  };
}
```

Fill in the first-pass layer list for hillshade, water, parks, roads, labels, and curated sites. Keep this module pure so Vitest can cover it without a DOM.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/build-terrain-style.test.ts`
Expected: PASS.

**Step 5: Snapshot changes**

Run: `git status --short`
Expected: If git exists later, only `src/map/buildTerrainStyle.ts` and its test should be new/modified. Otherwise log `"git unavailable"`.

### Task 4: Replace the Three.js scene with a MapLibre shell

**Files:**
- Create: `src/map/MapView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles.css`
- Test: `tests/e2e/map-shell.spec.ts`

**Step 1: Write the failing browser spec**

```ts
import { expect, test } from "@playwright/test";

test("loads the Huntsville terrain map shell", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Huntsville Terrain Explorer" })
  ).toBeVisible();
  await expect(page.getByTestId("terrain-map")).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/map-shell.spec.ts`
Expected: FAIL because the page still renders the diorama shell and no terrain map container exists.

**Step 3: Write minimal implementation**

```tsx
export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildTerrainStyle(),
      center: INITIAL_CAMERA.center,
      zoom: INITIAL_CAMERA.zoom,
      pitch: INITIAL_CAMERA.pitch,
      bearing: INITIAL_CAMERA.bearing
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    return () => map.remove();
  }, []);

  return <div ref={containerRef} data-testid="terrain-map" className="map-canvas" />;
}
```

Import `maplibre-gl/dist/maplibre-gl.css` in `src/main.tsx`, replace the old scene container in `src/App.tsx`, and restyle `src/styles.css` around a map-first layout.

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/map-shell.spec.ts`
Expected: PASS.

**Step 5: Snapshot changes**

Run: `git status --short`
Expected: If git exists later, only the shell-related files above should be included. Otherwise log `"git unavailable"`.

### Task 5: Add selected-site state, layer toggles, and the info card

**Files:**
- Create: `src/store/mapUiStore.ts`
- Create: `src/ui/LayerControls.tsx`
- Create: `src/ui/SiteInfoCard.tsx`
- Modify: `src/map/MapView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `tests/unit/map-ui-store.test.ts`
- Modify: `tests/e2e/controls.spec.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { createMapUiStore } from "../../src/store/mapUiStore";

describe("map ui store", () => {
  it("tracks selected site ids and terrain toggles", () => {
    const store = createMapUiStore();
    store.getState().selectSite("monte-sano-state-park");
    expect(store.getState().selectedSiteId).toBe("monte-sano-state-park");
    store.getState().toggleContours();
    expect(store.getState().showContours).toBe(true);
  });
});
```

```ts
import { expect, test } from "@playwright/test";

test("clicking a curated site opens the info card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Monte Sano State Park" }).click();
  await expect(
    page.getByRole("heading", { name: "Monte Sano State Park" })
  ).toBeVisible();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/map-ui-store.test.ts`
Expected: FAIL because the store does not exist yet.

Run: `npm run test:e2e -- tests/e2e/controls.spec.ts`
Expected: FAIL because the old preset-based controls are still in place.

**Step 3: Write minimal implementation**

```ts
export const createMapUiStore = () =>
  create<MapUiState>((set) => ({
    selectedSiteId: null,
    showContours: false,
    selectSite: (siteId) => set({ selectedSiteId: siteId }),
    toggleContours: () => set((state) => ({ showContours: !state.showContours }))
  }));
```

Expose a small curated site list in `LayerControls.tsx`, render `SiteInfoCard.tsx` from the selected feature, and wire `MapView.tsx` so marker clicks and button clicks both update the same store.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/map-ui-store.test.ts`
Expected: PASS.

Run: `npm run test:e2e -- tests/e2e/controls.spec.ts`
Expected: PASS.

**Step 5: Snapshot changes**

Run: `git status --short`
Expected: If git exists later, only the store, UI, and related test files should appear. Otherwise log `"git unavailable"`.

### Task 6: Replace placeholder data scripts with generated terrain/vector/site assets

**Files:**
- Create: `data/natural-sites/huntsville-natural-sites.yaml`
- Create: `scripts/build-natural-sites.mjs`
- Modify: `scripts/build-data.mjs`
- Modify: `scripts/build-terrain-tiles.mjs`
- Modify: `scripts/build-vector-tiles.mjs`
- Modify: `scripts/fetch-dem.mjs`
- Modify: `scripts/fetch-vectors.mjs`
- Test: `tests/unit/build-natural-sites.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildNaturalSitesFeatureCollection } from "../../scripts/build-natural-sites.mjs";

describe("natural site build script", () => {
  it("normalizes authored yaml into geojson", () => {
    const collection = buildNaturalSitesFeatureCollection([
      {
        id: "monte-sano-state-park",
        name: "Monte Sano State Park",
        category: "park",
        coordinates: [-86.53, 34.75]
      }
    ]);

    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features[0].properties.id).toBe("monte-sano-state-park");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/build-natural-sites.test.ts`
Expected: FAIL because the build helper and YAML source do not exist.

**Step 3: Write minimal implementation**

```js
export function buildNaturalSitesFeatureCollection(entries) {
  return {
    type: "FeatureCollection",
    features: entries.map((entry) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: entry.coordinates
      },
      properties: {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        description: entry.description ?? ""
      }
    }))
  };
}
```

Use `data/natural-sites/huntsville-natural-sites.yaml` as the authored source of truth, update `scripts/build-data.mjs` to run all three build scripts, and replace the placeholder `console.log` fetch/build scripts with helpers that validate raw-source locations and emit final runtime files in `public/generated/terrain/`, `public/generated/vectors/`, and `public/generated/sites/`.

**Step 4: Run script and tests to verify they pass**

Run: `npm run test -- tests/unit/build-natural-sites.test.ts`
Expected: PASS.

Run: `npm run build:data`
Expected: PASS with logs that confirm generated terrain, vector, and natural-site assets were written under `public/generated/`.

**Step 5: Snapshot changes**

Run: `git status --short`
Expected: If git exists later, only the data-authoring and build-script files should appear. Otherwise log `"git unavailable"`.

### Task 7: Remove obsolete diorama code, rebalance bundling, and replace visual coverage

**Files:**
- Modify: `vite.config.ts`
- Delete: `src/scene/HuntsvilleScene.tsx`
- Delete: `src/scene/WorldChunk.tsx`
- Delete: `src/scene/WorldRoot.tsx`
- Delete: `src/scene/animation.ts`
- Delete: `src/scene/atmosphere.ts`
- Delete: `src/scene/cameraPresets.ts`
- Delete: `src/scene/chunkLoader.ts`
- Delete: `src/scene/lighting.ts`
- Delete: `src/scene/lod.ts`
- Delete: `src/scene/useWorldData.ts`
- Delete: `src/landmarks/buildLandmarkTiles.ts`
- Delete: `src/landmarks/loadLandmarks.ts`
- Delete: `src/landmarks/types.ts`
- Delete: `src/pipeline/buildings.ts`
- Delete: `src/pipeline/terrain.ts`
- Delete: `src/pipeline/vectors.ts`
- Delete: `src/ui/ControlPanel.tsx`
- Delete: `src/ui/LandmarkInfoCard.tsx`
- Delete: `src/store/uiStore.ts`
- Delete: `tests/unit/atmosphere.test.ts`
- Delete: `tests/unit/building-massing.test.ts`
- Delete: `tests/unit/camera-presets.test.ts`
- Delete: `tests/unit/chunk-loader.test.ts`
- Delete: `tests/unit/landmark-schema.test.ts`
- Delete: `tests/unit/landmark-style.test.ts`
- Delete: `tests/unit/terrain.test.ts`
- Delete: `tests/unit/vector-priority.test.ts`
- Delete: `tests/unit/world-data.test.ts`
- Delete: `tests/e2e/helpers/openPreset.ts`
- Modify: `tests/e2e/visual.spec.ts`

**Step 1: Write the failing visual/browser spec**

```ts
import { expect, test } from "@playwright/test";

test("terrain overview remains legible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Huntsville Terrain Explorer" })).toBeVisible();
  await expect(page).toHaveScreenshot("huntsville-terrain-overview.png");
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/visual.spec.ts`
Expected: FAIL because the old screenshot and scene-centric UI no longer match the new map.

**Step 3: Write minimal implementation**

```ts
manualChunks(id) {
  if (id.includes("/maplibre-gl/")) {
    return "map-vendor";
  }

  if (id.includes("/react/") || id.includes("/react-dom/")) {
    return "react-vendor";
  }
}
```

Remove the obsolete diorama modules and tests once nothing imports them, update `vite.config.ts` to chunk `maplibre-gl` instead of the old scene stack, and replace the Playwright visual snapshot with the new map overview.

**Step 4: Run full verification**

Run: `npm run test`
Expected: PASS.

Run: `npm run build:data`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

Run: `npm run test:e2e`
Expected: PASS.

Before reporting success, follow `@verification-before-completion`.

**Step 5: Snapshot changes**

Run: `git status --short`
Expected: If git exists later, only the new terrain-map code and generated screenshot snapshot should remain. Otherwise log `"git unavailable"` and record the verification outputs in the execution log.
