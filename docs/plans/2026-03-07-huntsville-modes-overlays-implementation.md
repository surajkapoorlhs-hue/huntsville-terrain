# Huntsville Modes And Overlays Implementation Plan

> **Execution:** Use `executing-plans` to implement this plan task-by-task.

**Goal:** Add a full mode-driven map system (`Reference`, `Terrain`, `Topo`, `Relief Model`), nested `Reference style` choices (`Civic Atlas`, `Natural Paper`), a smaller right rail, and a first overlay pass for streams, preserves/parks, curated sites, and trails if feasible.

**Architecture:** Replace the remaining relief-boost-only control model with typed map-mode and reference-style state, add overlay visibility state, and build a local vector-generation pipeline for contours and natural overlays. Apply cartographic profiles at runtime rather than layering ad hoc paint updates.

**Tech Stack:** React 19, Vite, TypeScript, MapLibre GL JS, Zustand, Vitest, Playwright, Node.js, Python 3.11, rasterio, numpy

---

## Execution Notes

- `huntsville-diorama/` is not a git repository, so worktree/commit steps remain unavailable.
- The app already runs on local USGS-derived terrain; this plan builds on that.
- `Trails` are in scope, but if source quality is poor they should be explicitly marked deferred rather than shipped badly.

### Task 1: Replace relief-boost-only state with map mode + reference style

**Files:**
- Modify: `src/store/mapUiStore.ts`
- Modify: `src/map/urlState.ts`
- Create: `src/map/mapModes.ts`
- Test: `tests/unit/map-ui-store.test.ts`
- Modify: `tests/unit/url-state.test.ts`

**Step 1: Write the failing tests**
- `mapMode` defaults to `reference`
- `referenceStyle` defaults to `civic-atlas`
- URL round-trips `mode=terrain` and `refStyle=natural-paper`

**Step 2: Run test to verify it fails**
Run: `npm run test -- tests/unit/map-ui-store.test.ts tests/unit/url-state.test.ts`
Expected: FAIL because those fields do not exist yet.

**Step 3: Write minimal implementation**
- Add typed `MapMode` and `ReferenceStyle`
- Add store setters
- Add URL parse/stringify support

**Step 4: Run test to verify it passes**
Run: `npm run test -- tests/unit/map-ui-store.test.ts tests/unit/url-state.test.ts`
Expected: PASS.

### Task 2: Replace the current rail controls with compact mode/style/overlay sections

**Files:**
- Modify: `src/ui/LayerControls.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.tsx`
- Modify: `tests/e2e/controls.spec.ts`
- Modify: `tests/e2e/layout.spec.ts`

**Step 1: Write the failing browser tests**
- Expect `Map mode` buttons for `Reference`, `Terrain`, `Topo`, `Relief Model`
- Expect `Reference style` controls only while `Reference` is active
- Expect the right rail width to be tighter than the current implementation

**Step 2: Run tests to verify they fail**
Run: `npm run test:e2e -- tests/e2e/controls.spec.ts tests/e2e/layout.spec.ts`
Expected: FAIL because the old rail is still present.

**Step 3: Write minimal implementation**
- Compress the right rail
- Add `Map mode`
- Add conditional `Reference style`
- Add placeholder `Overlays` section (real overlay data arrives in later tasks)

**Step 4: Run tests to verify they pass**
Run: `npm run test:e2e -- tests/e2e/controls.spec.ts tests/e2e/layout.spec.ts`
Expected: PASS.

### Task 3: Replace relief profiles with mode + reference-style cartographic profiles

**Files:**
- Modify: `src/map/buildTerrainStyle.ts`
- Modify: `src/map/MapView.tsx`
- Modify: `src/map/mapStatus.ts`
- Test: `tests/unit/build-terrain-style.test.ts`
- Modify: `tests/e2e/controls.spec.ts`

**Step 1: Write the failing tests**
- Unit tests should assert:
  - `Reference/Civic Atlas` and `Reference/Natural Paper` differ
  - `Terrain` is stronger than `Reference`
  - `Relief Model` is the most sculpted / grayscale
- Browser test should assert selecting `Terrain` updates the URL and runtime state

**Step 2: Run tests to verify they fail**
Run:
- `npm run test -- tests/unit/build-terrain-style.test.ts`
- `npm run test:e2e -- tests/e2e/controls.spec.ts`

**Step 3: Write minimal implementation**
- Replace `RELIEF_PROFILES` with:
  - `MAP_MODE_PROFILES`
  - `REFERENCE_STYLE_PROFILES`
- Apply `Reference style` only inside `Reference`
- Remove the old relief-boost-specific logic entirely

**Step 4: Run tests to verify they pass**
Run:
- `npm run test -- tests/unit/build-terrain-style.test.ts`
- `npm run test:e2e -- tests/e2e/controls.spec.ts`

### Task 4: Generate contours from the local DEM and add `Topo`

**Files:**
- Modify: `scripts/usgs_terrain.py`
- Modify: `scripts/build-data.mjs`
- Create: `public/generated/terrain/contours.geojson` (generated)
- Modify: `src/map/buildTerrainStyle.ts`
- Modify: `src/map/MapView.tsx`
- Test: `tests/unit/usgs-terrain.test.ts`

**Step 1: Write the failing tests**
- Add one test for contour-generation helper behavior
- Add one style test that `Topo` enables a contour source/layer

**Step 2: Run test to verify it fails**
Run: `npm run test -- tests/unit/usgs-terrain.test.ts tests/unit/build-terrain-style.test.ts`
Expected: FAIL because contours do not exist yet.

**Step 3: Write minimal implementation**
- Derive contour lines from the clipped DEM at subtle intervals
- Emit generated contour GeoJSON
- Wire `Topo` mode to show contours and hydro emphasis

**Step 4: Run tests to verify it passes**
Run: `npm run test -- tests/unit/usgs-terrain.test.ts tests/unit/build-terrain-style.test.ts`
Expected: PASS.

### Task 5: Generate the first natural overlays: streams, preserves/parks, curated sites, and try trails

**Files:**
- Modify: `scripts/fetch-vectors.mjs`
- Modify: `scripts/build-vector-tiles.mjs` or replace with generated overlay builders
- Create: `public/generated/overlays/*.geojson`
- Modify: `src/map/buildTerrainStyle.ts`
- Modify: `src/map/MapView.tsx`
- Modify: `src/ui/LayerControls.tsx`
- Test: `tests/e2e/controls.spec.ts`

**Step 1: Write the failing browser test**
- Expect the `Overlays` section to expose `Streams`, `Preserves/Parks`, `Curated sites`, and `Trails`
- Expect at least one overlay toggle to update URL or visible state

**Step 2: Run test to verify it fails**
Run: `npm run test:e2e -- tests/e2e/controls.spec.ts`
Expected: FAIL because overlays are not implemented yet.

**Step 3: Write minimal implementation**
- Fetch overlay data for the Huntsville bbox
- Build generated GeoJSON overlays
- Add runtime visibility toggles
- If trails are too noisy, keep the control but mark it disabled with explicit copy

**Step 4: Run tests to verify it passes**
Run: `npm run test:e2e -- tests/e2e/controls.spec.ts`
Expected: PASS.

### Task 6: Refresh visual coverage and run full verification

**Files:**
- Modify: `tests/e2e/visual.spec.ts`
- Update: `tests/e2e/visual.spec.ts-snapshots/*`

**Step 1: Refresh visual baseline**
Run: `npm run test:e2e -- tests/e2e/visual.spec.ts --update-snapshots`

**Step 2: Final verification**
Run:
- `npm run test`
- `npm run typecheck`
- `npm run build:data`
- `npm run build`
- `npm run test:e2e`
Expected: all PASS.
