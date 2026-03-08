# Huntsville Terrain Map Design

## Status

Validated with the user on March 7, 2026.

## Goal

Replace the current "living diorama" presentation with a geographically accurate, shareable Huntsville-core terrain explorer that supports tilt, rotate, zoom, and click-based discovery of major natural sites.

## Chosen Product Decisions

- Replace the existing diorama instead of creating a separate subproject.
- Keep the geographic scope to Huntsville core.
- Match the feel of a Google Maps terrain view without depending on Google map tiles.
- Ship as a shareable website.
- Use an open-data stack rather than a commercial map API.
- Build an explorer, not a guided story map.
- Skip general search for v1 and rely on direct exploration plus curated feature clicks.
- Use curated natural highlights rather than ingesting every possible outdoor feature.

## Product Shape

The first version should feel like a terrain-first Huntsville explorer, not a cinematic demo. The opening camera should land on Huntsville core at an oblique angle with terrain enabled so Monte Sano, Green Mountain, Chapman Mountain, and the valley structure read immediately. Roads, neighborhood labels, parks, and water should stay visible, but terrain shading and relief should be strong enough that the landscape is the primary subject.

The interface should stay light. The main canvas is the map. Controls are limited to standard map navigation, a compact layer area, and a small information card that appears when someone clicks a featured natural site. Discovery happens through panning, zooming, rotating, and clicking curated sites such as Monte Sano State Park, Monte Sano Nature Preserve, Green Mountain Nature Trail, Chapman Mountain Nature Preserve, and similar highlights.

## Technical Direction

The recommended runtime is `MapLibre GL JS` with open elevation and vector tiles. This is a better fit than the current custom Three.js scene because it provides native map interaction behavior, terrain support, vector layer styling, and a simpler path to a terrain experience that feels familiar and credible.

Two alternatives were considered but rejected for v1:

- Rebuilding the whole map as a pure Three.js scene would create unnecessary work around map controls, labels, and data rendering.
- Moving to a larger globe/GIS stack such as Cesium would add complexity that does not help a Huntsville-core explorer.

## Accuracy Definition

"Geographically accurate" means the terrain surface comes from real elevation data instead of hand-modeled geometry. Natural sites, roads, water, and land boundaries should come from real datasets, not invented shapes. The default view should avoid hidden vertical exaggeration. If a more dramatic relief mode is ever added, it should be an explicit toggle rather than the baseline presentation.

## Data Strategy

### Elevation

Use a Huntsville-core DEM derived from local open elevation data, ideally USGS 3DEP for the landform surface. Preprocess the DEM into web-friendly terrain tiles for browser rendering. Derive subtle hillshade and optional contour overlays so ridges, valleys, and drainage structure remain legible.

### Basemap vectors

Use open vector data derived from OpenStreetMap and package it for static hosting. The vector stack should include roads, water, parks, preserves, place labels, and landcover cues. Styling should aim for the calm, readable terrain palette of the target screenshot rather than a loud GIS treatment.

### Curated natural highlights

Store a small hand-authored GeoJSON dataset for featured natural places. Each feature should include:

- name
- category
- short description
- coordinates or geometry
- optional default camera framing

## Layer Stack

Recommended render order:

1. Terrain source and shaded relief
2. Terrain tint and optional contour overlays
3. Water bodies and streams
4. Park and preserve fills
5. Roads and transportation lines
6. Place and neighborhood labels
7. Curated natural-site click targets and active-state styling

The visual goal is a familiar terrain map balance: terrain remains legible while roads and place context stay readable.

## App Architecture

Keep the existing Vite and React shell in the current project, but replace the scene-oriented rendering path with a map-oriented structure.

Suggested structure:

- `src/map/` for `MapLibre` initialization, terrain sources, and style/layer setup
- `src/data/` for curated GeoJSON and generated metadata
- `src/ui/` for controls and the site information card
- `scripts/` for terrain and vector preprocessing

The root UI should become a map view instead of a custom 3D scene. Runtime state should remain small: selected feature, layer visibility, and map readiness are likely enough.

## Runtime Behavior

On load, the app should initialize the Huntsville terrain map at a default oblique camera angle with terrain enabled. Curated natural-site features should be clickable. Clicking a site opens a compact info card with the place name, type, short description, and room for future fly-to behavior if needed.

If terrain data fails to load, the app should degrade to a flat styled map rather than leaving the page unusable.

## First Milestone

The first implementation milestone should include:

- a working shareable Huntsville-core map view
- true terrain rendering with tilt, rotate, and zoom
- styled open vector layers that approximate the desired terrain-map feel
- a curated natural-sites dataset
- click interaction with a compact info card

This milestone is intentionally narrow. It should prove the terrain experience, not solve every GIS feature up front.

## Risks

- Cartographic styling risk: accurate data can still look poor if terrain tint, hillshade, and label contrast are not tuned well.
- Performance risk: terrain and vector layers can get heavy if the coverage area or tile density grows too much.
- Scope risk: trying to ingest every outdoor dataset too early will slow down the first useful version.
- Product risk: "Google-like" should mean readable and familiar, not a pixel-for-pixel imitation.

## Mitigations

- Clip coverage tightly to Huntsville core for v1.
- Pre-generate optimized terrain and vector assets.
- Keep the UI minimal.
- Start with curated highlights instead of broad feature ingestion.
- Treat cartographic tuning as first-class work, not a final polish step.

## Verification For V1

- Desktop browser smoke checks for load, zoom, rotate, and pitch
- Mobile-size layout checks
- Visual verification that major landforms read correctly
- Click interaction checks for each curated natural site
- Comparison of key terrain features against known references

## Immediate Next Step

Set up implementation planning for the terrain-map replacement, including the chosen map engine, data pipeline shape, milestone breakdown, and verification commands.
