# Huntsville USGS 1m Terrain Implementation Plan

> **Execution:** Use `executing-plans` to implement this plan task-by-task.

**Goal:** Replace the current demo terrain source with a higher-resolution official USGS 3DEP Huntsville-core terrain pipeline and wire the app to local generated terrain tiles.

**Architecture:** Query the official USGS National Map API to select the latest 1 m DEM tiles intersecting Huntsville core, download them into the workspace, merge/clip them into a manageable local DEM, generate Terrarium PNG terrain tiles for web delivery, and switch the MapLibre terrain source to those local tiles. Keep the tile-selection and terrain-encoding logic covered by small unit tests.

**Tech Stack:** Python 3, project-local virtualenv, rasterio, mercantile, numpy, pillow, React 19, Vite, TypeScript, MapLibre GL JS, Vitest, Playwright

---

## Execution Notes

- `huntsville-diorama/` is not a git repository, so worktree/commit steps remain unavailable.
- The current official query already confirmed USGS 3DEP 1 m DEM coverage exists for the Huntsville-core bbox.
- To keep the browser pipeline tractable, build a clipped local DEM at a coarser working resolution than raw 1 m if needed, but source it from the official 1 m DEM products.

### Task 1: Add pure helpers for official USGS tile selection and Terrarium encoding

**Files:**
- Create: `scripts/usgs_terrain.py`
- Create: `tests/unit/usgs-terrain.test.js`

**Step 1: Write the failing test**
- Add one unit test for selecting the latest tile per `x##y###` tile key from mixed API results.
- Add one unit test for Terrarium encoding of a known elevation value.

**Step 2: Run test to verify it fails**
Run: `npm run test -- tests/unit/usgs-terrain.test.js`
Expected: FAIL because the helper module does not exist yet.

**Step 3: Write minimal implementation**
- Add helpers for:
  - parsing a tile key from a USGS product title
  - selecting the latest download per tile key
  - encoding elevation arrays into Terrarium RGB

**Step 4: Run test to verify it passes**
Run: `npm run test -- tests/unit/usgs-terrain.test.js`
Expected: PASS.

### Task 2: Set up project-local raster tooling and download the official Huntsville-core DEM coverage

**Files:**
- Modify: `scripts/fetch-dem.mjs`
- Create: `.venv/` (local tooling only)
- Output: `data/raw/elevation/usgs-1m/*.tif`
- Output: `data/raw/elevation/usgs-1m/coverage.json`

**Step 1: Create local venv and install tooling**
Run:
- `python3 -m venv .venv`
- `.venv/bin/python -m pip install rasterio mercantile numpy pillow`

**Step 2: Implement download flow**
- Update `scripts/fetch-dem.mjs` to invoke the Python helper for API query + download.
- Query the official TNM API for the Huntsville bbox and persist the selected coverage manifest.
- Download the selected DEM GeoTIFF files into `data/raw/elevation/usgs-1m/`.

**Step 3: Verify**
Run: `node scripts/fetch-dem.mjs`
Expected: PASS with a saved `coverage.json` and downloaded GeoTIFF files.

### Task 3: Build a clipped Huntsville DEM and generate local Terrarium tiles

**Files:**
- Modify: `scripts/build-terrain-tiles.mjs`
- Modify: `scripts/usgs_terrain.py`
- Output: `data/processed/terrain/huntsville-core-dem.tif`
- Output: `public/generated/terrain/tiles/{z}/{x}/{y}.png`
- Output: `public/generated/terrain/source.json`

**Step 1: Write the failing test**
- Add a unit test that verifies the generated terrain manifest points at local tile paths rather than the remote demo tile JSON.

**Step 2: Run test to verify it fails**
Run: `npm run test -- tests/unit/build-terrain-style.test.ts`
Expected: FAIL once the local-source expectation is added.

**Step 3: Write minimal implementation**
- Merge and clip the downloaded DEMs to the Huntsville-core bounds at a practical working resolution.
- Generate Terrarium PNG tiles for the map zoom range.
- Write a source manifest that records bounds, zoom range, encoding, and provenance.
- Update the Node wrapper script to run the Python terrain build.

**Step 4: Verify**
Run: `node scripts/build-terrain-tiles.mjs`
Expected: PASS with local terrain tiles under `public/generated/terrain/tiles/`.

### Task 4: Switch the app from demo terrain to local terrain and validate the visual effect

**Files:**
- Modify: `src/map/buildTerrainStyle.ts`
- Modify: `tests/e2e/controls.spec.ts`
- Modify: `tests/e2e/visual.spec.ts`

**Step 1: Write the failing tests**
- Strengthen the terrain source test so the DEM source uses local tile paths.
- Keep the relief toggle browser test.

**Step 2: Run tests to verify they fail**
Run:
- `npm run test -- tests/unit/build-terrain-style.test.ts`
- `npm run test:e2e -- tests/e2e/controls.spec.ts`

**Step 3: Write minimal implementation**
- Point the `raster-dem` source at local Terrarium tiles.
- Keep the stronger relief profiles.
- Refresh the visual snapshot if the terrain look changes materially.

**Step 4: Final verification**
Run:
- `npm run test`
- `npm run typecheck`
- `npm run build:data`
- `npm run build`
- `npm run test:e2e`
Expected: all PASS.
