# Plans Index

This folder contains the design and implementation notes used to build the current Huntsville Terrain Viewer.

## How to read these files

- Files in this folder are historical working plans, not the current product spec.
- The canonical current-state docs are:
  - [`../product-brief.md`](../product-brief.md)
  - [`../performance-notes.md`](../performance-notes.md)
  - [`../qa-inventory.md`](../qa-inventory.md)
  - [`../../README.md`](../../README.md)

## Status summary

- `2026-03-07-huntsville-terrain-map-design.md`
  - Historical design doc for the initial terrain viewer direction.
- `2026-03-07-huntsville-terrain-map-implementation.md`
  - Historical implementation notes for the initial terrain viewer build.
- `2026-03-07-huntsville-map-modes-design.md`
  - Historical design pass for map modes and reference styles.
- `2026-03-07-huntsville-map-modes-implementation.md`
  - Historical implementation notes for map modes.
- `2026-03-07-huntsville-modes-overlays-design.md`
  - Historical design pass for overlays and UI controls.
- `2026-03-07-huntsville-modes-overlays-implementation.md`
  - Historical implementation notes for overlays and controls.
- `2026-03-07-huntsville-first-pass-improvements.md`
  - Historical polish pass for default terrain mode, better overlays, dock collapse, and terrain reliability improvements.
- `2026-03-07-huntsville-relief-reliability-pass.md`
  - Historical reliability and shading pass notes.
- `2026-03-07-huntsville-usgs-1m-terrain.md`
  - Historical terrain pipeline notes tied to the USGS-derived DEM workflow.

## Current status

As of March 8, 2026, the shipped app is a MapLibre-based terrain viewer with:

- local generated terrain and overlay assets
- terrain/reference/topo/relief map modes
- curated natural and practical places
- candidate-home pins with local browser persistence
- automated unit, e2e, and visual coverage
