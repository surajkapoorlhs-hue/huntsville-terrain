# Huntsville Terrain Viewer Brief

## Goal

Provide a local-first terrain viewer for Huntsville, Alabama that makes the city's ridges, valleys, preserves, practical destinations, and candidate-home locations easy to inspect while house hunting.

## Current product shape

- Desktop-first React + Vite app using MapLibre GL terrain.
- Real raster DEM terrain rendered from locally generated Terrarium tiles.
- Terrain, topo, reference, and relief-model map modes.
- Overlay controls for streams, preserves/parks, curated places, and trails.
- Curated nature and practical destinations, including:
  - Monte Sano State Park
  - Monte Sano Nature Preserve
  - Green Mountain Nature Trail
  - Chapman Mountain Nature Preserve
  - Blevins Gap
  - Crestwood Medical Center
  - Huntsville Hospital
- Candidate-home address entry with local browser persistence.
- Shareable URL state for camera and curated-place selection.

## Experience priorities

- Terrain should explain Huntsville before labels do.
- Terrain mode is the default and should remain the best-looking everyday view.
- Natural sites and practical destinations should feel curated, not like a noisy GIS layer dump.
- Candidate homes should be fast to add and remove without requiring an account or backend.

## Intentional non-goals

- Full offline basemap hosting in the current version.
- Public multi-user collaboration on saved homes.
- Large-scale parcel or MLS integration.
- Mobile-first optimization beyond keeping the floating dock usable.

## Known limitations

- Basemap raster tiles and glyphs still come from remote public services.
- Candidate-home addresses are stored only in local browser `localStorage`.
- Address geocoding uses a submit-only public geocoder flow and should stay low-volume.
