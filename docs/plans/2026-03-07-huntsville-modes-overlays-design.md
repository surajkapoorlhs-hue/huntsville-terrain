# Huntsville Modes, Reference Styles, And Overlays Design

## Status

Validated with the user on March 7, 2026.

## Goal

Expand the Huntsville terrain explorer from a single-mode map into a mode-driven landscape viewer with multiple map readings, a compact right rail, and a first overlay pass for natural features.

## Primary Controls

The interface should separate three concerns:

- `Map mode`: an exclusive choice for how the map should be read.
- `Reference style`: a secondary choice that only appears inside `Reference`.
- `Overlays`: limited additive data sources for natural features.

## Chosen Map Modes

- `Reference`
- `Terrain`
- `Topo`
- `Relief Model`

### Reference

The default opening mode. It should remain the most approachable view for orientation and sharing.

### Terrain

Quieter basemap, stronger hillshade, more pronounced landform.

### Topo

Contour-aware terrain reading with hydro emphasis. Contours should be present but not loud.

### Relief Model

A grayscale or near-grayscale sculpted terrain view inspired by the fallback-style image the user liked.

## Chosen Reference Styles

These only apply when `Map mode === Reference`.

- `Civic Atlas`
- `Natural Paper`

### Civic Atlas

Cleaner and more utilitarian, with crisp roads and labels.

### Natural Paper

Warmer and more editorial, with softer roads and a more atmospheric terrain context.

## Chosen Overlays For First Pass

- `Streams`
- `Preserves/Parks`
- `Curated sites`
- `Trails` (attempt in the first overlay pass if data quality and extraction are acceptable)

Trails are included optimistically, but are the first overlay candidate to demote if source noise becomes a problem.

## Layout Direction

Keep the right rail, but make it smaller and tighter so the map owns more of the viewport.

Recommended approach:

- narrower desktop rail
- denser control cards
- `Map mode` first
- `Reference style` only when in `Reference`
- `Overlays` below that
- site list retained, but visually compressed

## Data Strategy

The local USGS-derived DEM remains the terrain backbone.

Additional derived or fetched products:

- local contour lines derived from the DEM
- stream and hydro line overlays
- preserve and park polygons
- trail lines

The overlay/vector pipeline should stay project-local and generated into `public/generated/`.

## Runtime Architecture

The runtime state should evolve to:

- `mapMode`
- `referenceStyle`
- `overlays`
- `selectedSiteId`

The rendering system should apply:

- a cartographic profile for `mapMode`
- a nested style profile for `referenceStyle` when in `Reference`
- visibility toggles for overlays

This avoids ad hoc paint mutations and keeps the map logic composable.

## Recommended Build Order

### First implementation pass

- replace `Relief boost` with `Map mode`
- add `Reference`, `Terrain`, and `Relief Model`
- add `Reference style` with `Civic Atlas` and `Natural Paper`
- compress the right rail
- add URL sync for `mapMode` and `referenceStyle`

### Second implementation pass

- generate contours from the DEM
- add `Topo`
- add `Streams`, `Preserves/Parks`, and `Curated sites` overlays
- try to include `Trails` if the source is good enough

## Immediate Next Step

Create and execute an implementation plan for:

- new mode/reference-style state
- compact right rail
- `Reference`, `Terrain`, and `Relief Model`
- then the first overlay/vector generation pass including trails if feasible
