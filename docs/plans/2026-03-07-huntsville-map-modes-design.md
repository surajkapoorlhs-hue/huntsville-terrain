# Huntsville Map Modes And Overlays Design

## Status

Validated with the user on March 7, 2026.

## Goal

Extend the Huntsville terrain explorer with a deliberate cartographic mode system and a smaller overlay system, so users can switch between different ways of reading the same landscape without turning the app into a GIS control panel.

## Product Direction

The correct mental model is:

- `Map mode` chooses the overall visual language of the map.
- `Overlays` add specific categories of information on top.

This replaces the current single `Relief boost` control with something more understandable and more powerful.

## Chosen Mode Set

### 1. Reference

This is the balanced default view. Roads, labels, and familiar basemap context remain readable, while the terrain is present but secondary. This is the mode for orientation and general browsing.

### 2. Terrain

This is a terrain-first view that remains navigable. The basemap becomes quieter, hillshade becomes stronger, and the landform reads more clearly than in `Reference`.

### 3. Topo

This mode adds subtle contour lines and stronger hydro / landform cues. It should feel like a readable topographic map, not a dense GIS export. Contours must be present but not overwhelming.

### 4. Relief Model

This is the grayscale sculpted terrain view the user explicitly liked. It should minimize map ink, mute the basemap heavily, and let the terrain surface do most of the work visually. Landmarks and essential site markers can remain visible.

## Overlay Set

Overlays should stay selective. The first useful set is:

- `Streams`
- `Preserves/Parks`
- `Curated sites`
- `Trails`

The first three are the best candidates for the initial overlay pass. `Trails` should follow once source quality is confirmed.

## Key UX Rule

Modes define the personality of the map.
Overlays add information.

Avoid turning everything into an independent toggle. Too many toggles would undermine the clarity of the product.

## Data Strategy

The existing local USGS-derived DEM is now the foundation for multiple visual products:

- terrain tiles for 3D ground
- hillshade variants for different map modes
- contour lines derived from the DEM

Vector sources should be split by overlay category:

- streams / hydro lines
- preserve and park polygons
- trail lines
- curated natural-site points

## Runtime Architecture

`MapView` should stop treating the map’s cartography as a collection of ad hoc paint-property mutations. Instead, the runtime should apply a `mapMode` profile object.

Each mode profile should define:

- terrain exaggeration
- hillshade intensity and palette
- basemap opacity / contrast / saturation
- grayscale or low-ink treatment where appropriate
- whether contours are enabled
- how prominent labels and site markers should be

Overlays should be separate from modes and expressed as visibility-controlled layers or sources.

This gives the app two clear systems:

- one for cartographic mode
- one for optional overlay visibility

## Recommended Build Order

### First implementation pass

Build:

- `Map mode` switcher
- `Reference`
- `Terrain`
- `Relief Model`
- URL sync for `mode`
- updated tests and visual baselines

This pass mostly reuses existing data and should provide the biggest immediate UX lift.

### Second implementation pass

Build:

- DEM-derived contour generation
- `Topo` mode
- `Streams` overlay
- `Preserves/Parks` overlay
- `Curated sites` overlay controls refinement

### Third implementation pass

Build:

- `Trails` overlay
- additional overlay polish / hierarchy tuning

## Default Recommendation

Keep `Reference` as the default opening mode.

It remains the most approachable entry point for a shareable map, while `Terrain`, `Topo`, and `Relief Model` become intentional alternate ways of reading the same geography.

## Explicit Deferrals

Not recommended for the next pass:

- independent toggles for every map layer
- advanced GIS inspection tools
- broad search / geocoding
- replacing the raster reference basemap with a fully custom local vector basemap in the same pass

## Immediate Next Step

Create an implementation plan for:

- replacing `Relief boost` with `Map mode`
- introducing mode profiles
- shipping `Reference`, `Terrain`, and `Relief Model`
- keeping overlays scoped and simple for the first overlay pass
