# Performance Notes

## Current baseline

Verification on March 8, 2026:

- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

Latest production build output:

- `dist/assets/index-BGSeHM30.js`: 26.95 kB
- `dist/assets/react-vendor-DYDRkvmU.js`: 192.50 kB
- `dist/assets/map-vendor-Bkj_MtEG.js`: 1,022.62 kB
- `dist/assets/index-CP0jjeBG.css`: 6.27 kB
- `dist/assets/map-vendor-DwUhsmFz.css`: 69.92 kB

## What is working well

- Terrain rendering is stable and no longer throws false map-data errors on first load.
- Terrain mode remains responsive enough for manual panning, rotation, and zooming on desktop.
- Generated DEM tiles now avoid the earlier abyss-pixel artifact caused by invalid source elevations.
- The default terrain shading now reads more clearly at overview zooms without making close views overly harsh.

## Main bottlenecks

- `map-vendor` remains the dominant bundle at just over 1 MB minified.
- Terrain tile payloads are substantial because the repo ships generated raster DEM tiles in `public/generated/terrain/tiles/`.
- Basemap requests still depend on public remote services, so perceived performance is partly network-bound.

## Repo-size considerations

- `public/` is about 207 MB because it includes generated runtime assets.
- `data/raw/elevation/` is much larger and should stay out of Git history.
- `dist/`, `node_modules/`, and local virtualenvs should never be committed.

## Next likely performance work

- Reduce or split the MapLibre bundle if startup time becomes a pain point.
- Host or prepackage the basemap/glyph stack if true offline use becomes necessary.
- Consider reducing shipped terrain tile coverage or adding a download/build step if repo size becomes a problem.
