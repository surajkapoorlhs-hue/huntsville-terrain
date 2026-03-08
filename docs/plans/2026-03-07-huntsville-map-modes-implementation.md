# Huntsville Map Modes Implementation Plan

> **Execution:** Use `executing-plans` to implement this plan task-by-task.

**Goal:** Replace the current standalone `Relief boost` control with a proper `Map mode` system and ship the first three modes: `Reference`, `Terrain`, and `Relief Model`.

**Architecture:** Introduce a typed `mapMode` state and URL parameter, move style parameters into mode profiles, and make `MapView` apply the selected mode to terrain, hillshade, and basemap treatment. Keep overlays separate from modes; do not ship the full overlay system in the same pass.

**Tech Stack:** React 19, Vite, TypeScript, MapLibre GL JS, Zustand, Vitest, Playwright

---

## Execution Notes

- `huntsville-diorama/` is still not a git repo, so worktree/commit steps remain unavailable.
- This pass intentionally ships `Reference`, `Terrain`, and `Relief Model` only.
- `Topo` and overlay sources (streams, preserves, trails) belong to the next pass once contour/vector generation is in place.

### Task 1: Add typed map-mode state and URL support

**Files:**
- Modify: `src/store/mapUiStore.ts`
- Modify: `src/map/urlState.ts`
- Test: `tests/unit/map-ui-store.test.ts`
- Modify: `tests/unit/url-state.test.ts`

**Step 1: Write the failing tests**
- Add a unit test that the store defaults to `reference` and can switch to `terrain`.
- Add a unit test that URL state round-trips `mode=relief-model`.

**Step 2: Run tests to verify they fail**
Run: `npm run test -- tests/unit/map-ui-store.test.ts tests/unit/url-state.test.ts`
Expected: FAIL because `mapMode` does not exist yet.

**Step 3: Write minimal implementation**
- Add `MapMode = "reference" | "terrain" | "relief-model"`.
- Replace `reliefBoost` state with `mapMode`.
- Update URL parse/stringify helpers to support `mode`.

**Step 4: Run tests to verify they pass**
Run: `npm run test -- tests/unit/map-ui-store.test.ts tests/unit/url-state.test.ts`
Expected: PASS.

### Task 2: Replace the left-rail control with a map-mode switcher

**Files:**
- Modify: `src/ui/LayerControls.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `tests/e2e/controls.spec.ts`

**Step 1: Write the failing browser test**
- Add a browser assertion that the rail shows `Map mode` options and no longer shows `Relief boost`.

**Step 2: Run test to verify it fails**
Run: `npm run test:e2e -- tests/e2e/controls.spec.ts`
Expected: FAIL because the old control still exists.

**Step 3: Write minimal implementation**
- Rename the rail section to `Map mode`.
- Render 3 mutually exclusive buttons: `Reference`, `Terrain`, `Relief Model`.
- Keep `Natural sites` below as-is for now.

**Step 4: Run test to verify it passes**
Run: `npm run test:e2e -- tests/e2e/controls.spec.ts`
Expected: PASS.

### Task 3: Move cartographic settings into mode profiles and apply them at runtime

**Files:**
- Modify: `src/map/buildTerrainStyle.ts`
- Modify: `src/map/MapView.tsx`
- Modify: `src/map/mapStatus.ts`
- Test: `tests/unit/build-terrain-style.test.ts`
- Modify: `tests/e2e/controls.spec.ts`

**Step 1: Write the failing tests**
- Add unit assertions that:
  - `reference` remains balanced
  - `terrain` emphasizes landform more than `reference`
  - `relief-model` is the most muted/grayscale map-ink treatment
- Add a browser test that switching modes updates URL state and the mode badge/status if applicable.

**Step 2: Run tests to verify they fail**
Run:
- `npm run test -- tests/unit/build-terrain-style.test.ts`
- `npm run test:e2e -- tests/e2e/controls.spec.ts`

**Step 3: Write minimal implementation**
- Replace the relief profile concept with mode profiles keyed by map mode.
- Apply terrain exaggeration, hillshade colors, and basemap paint properties based on selected mode.
- Make `Relief Model` the deliberate grayscale sculpted mode.
- Keep `Reference` as the default opening mode.

**Step 4: Run tests to verify they pass**
Run:
- `npm run test -- tests/unit/build-terrain-style.test.ts`
- `npm run test:e2e -- tests/e2e/controls.spec.ts`

### Task 4: Refresh copy, visual coverage, and final verification

**Files:**
- Modify: `src/App.tsx`
- Modify: `tests/e2e/visual.spec.ts`
- Update: `tests/e2e/visual.spec.ts-snapshots/*`

**Step 1: Write the failing visual/browser expectation**
- Update the visual/browser copy expectations to refer to `Map mode` rather than `Relief boost`.

**Step 2: Run test to verify it fails**
Run: `npm run test:e2e -- tests/e2e/visual.spec.ts`
Expected: FAIL or snapshot mismatch because the controls changed.

**Step 3: Write minimal implementation**
- Update the side-panel explanatory copy if needed so it matches the new mode system.
- Refresh the visual baseline.

**Step 4: Final verification**
Run:
- `npm run test`
- `npm run typecheck`
- `npm run build:data`
- `npm run build`
- `npm run test:e2e`
Expected: all PASS.
