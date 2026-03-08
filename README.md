# Huntsville Terrain Viewer

Local-first terrain viewer for Huntsville, Alabama built for understanding ridge lines, preserves, practical destinations, and candidate-home locations while house hunting.

## What it does

- Opens directly into a high-legibility `Terrain` mode tuned for Huntsville's mountain fronts and valleys.
- Switches between `Terrain`, `Reference`, `Topo`, and `Relief Model` map modes.
- Shows curated natural places and practical destinations such as:
  - Monte Sano State Park
  - Monte Sano Nature Preserve
  - Green Mountain Nature Trail
  - Chapman Mountain Nature Preserve
  - Blevins Gap
  - Crestwood Medical Center
  - Huntsville Hospital
- Lets you add candidate-home addresses from the UI and save them locally in your browser.
- Persists map camera state and curated-place selection in the URL for easy sharing.
- Ships with locally generated terrain and overlay assets so the app works without rebuilding data first.

## Stack

- React 19
- Vite 7
- TypeScript
- MapLibre GL JS
- Zustand
- Vitest
- Playwright
- Python + Rasterio for the terrain-data pipeline

## Project status

The current app is a MapLibre terrain viewer. Earlier project notes may still mention a Three.js diorama direction; those are historical and should not be treated as the current architecture.

Current notable characteristics:

- Terrain, contours, overlays, and curated-place data are local.
- Basemap raster tiles and glyphs are still remote.
- Candidate homes are stored in browser `localStorage`, not a backend.

## Quick start

Requirements:

- Node 24+ recommended
- npm
- Python 3 with the local terrain virtualenv if you want to rebuild data

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

## Available scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run test
npm run test:e2e
npm run build:data
```

## Data pipeline

The repo includes generated runtime assets in `public/generated/`, so cloning the repo is enough to run the viewer.

If you want to rebuild data:

```bash
npm run build:data
```

That pipeline currently:

- rebuilds terrain tiles and contours from the USGS-derived DEM workflow
- rebuilds overlay GeoJSON for streams, parks, and trails
- preserves the curated-place layer used by the UI

Relevant scripts:

- [`scripts/build-data.mjs`](./scripts/build-data.mjs)
- [`scripts/usgs_terrain.py`](./scripts/usgs_terrain.py)
- [`scripts/build-natural-sites.mjs`](./scripts/build-natural-sites.mjs)

## Candidate-home addresses

Candidate homes are geocoded only when you submit the address. There is no autocomplete. Successful results are stored locally in the current browser.

Current behavior:

- add an address from the right dock
- see it appear as a red home marker
- reload the page and keep the marker
- remove it from the saved-home list later

This data is intentionally local-only for now.

## Folder guide

```text
src/
  data/             Curated places and address geocoding helpers
  map/              MapLibre style, runtime, and URL state
  store/            Zustand UI and saved-home state
  ui/               Dock controls and info card
scripts/            Terrain and data-build tooling
public/generated/   Generated terrain and overlay assets used at runtime
docs/               Product, QA, performance, and historical planning docs
tests/              Unit, smoke, e2e, and visual tests
```

## Verification

Run the full local verification set:

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Known limitations

- Basemap tiles come from `tile.openstreetmap.org`.
- Glyphs come from `demotiles.maplibre.org`.
- The main MapLibre vendor chunk is still large.
- The repository includes generated terrain assets, so the checkout is heavier than a code-only repo.
- Raw elevation downloads and local virtualenvs are intentionally not part of version control.

## Documentation

- [`docs/product-brief.md`](./docs/product-brief.md)
- [`docs/performance-notes.md`](./docs/performance-notes.md)
- [`docs/qa-inventory.md`](./docs/qa-inventory.md)
- [`docs/metro-bounds.md`](./docs/metro-bounds.md)
- [`docs/plans/README.md`](./docs/plans/README.md)

## Data sources

- USGS / The National Map for terrain inputs
- OpenStreetMap-derived and Overpass-derived overlay data
- Nominatim for submit-only address geocoding in the candidate-home flow
