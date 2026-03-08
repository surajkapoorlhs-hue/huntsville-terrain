# QA Inventory

## Functional pass

- App opens directly into `Terrain` mode.
- URL state restores curated-place selection and camera state.
- Curated natural places open the info card and fly the map correctly.
- Practical places open the info card and remain visually distinct from natural places.
- Candidate homes can be added by address, appear on the map, persist after reload, and be removed.
- Right-side dock can collapse and expand without losing map usability.
- Overlay toggles update visibility for streams, preserves/parks, curated places, and trails.
- Mobile layout keeps the map primary and the floating dock compact.

## Visual pass

- Monte Sano, Green Mountain, Chapman Mountain, and the southern ridges read as terrain, not soft background smudges.
- Terrain overview remains legible with the current balanced shading profile.
- Streams are visible without overpowering the map.
- Preserves/parks are easier to distinguish from the basemap than in the first pass.
- Practical places feel separate from natural sites, and candidate homes read clearly as temporary decision pins.

## Current automated coverage

- Unit tests cover map config, URL state, terrain-style construction, store state, and terrain-tile regression checks.
- End-to-end tests cover:
  - initial terrain-mode load
  - site and practical-place selection
  - saved-home add and reload persistence
  - reference-style switching
  - overlay toggles
  - dock collapse
  - mobile layout
  - terrain overview screenshot stability

## Useful manual screenshot targets

- Default terrain overview
- Rotated overview with northern/western ridges visible
- Monte Sano close oblique view
- Medical District / Jones Valley area
- Candidate-home pin near a hospital or preserve
