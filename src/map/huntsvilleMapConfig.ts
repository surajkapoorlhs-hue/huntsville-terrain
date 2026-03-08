import { naturalPlaces } from "../data/curatedPlaces";

export const HUNTSVILLE_CORE_BOUNDS = [-86.72, 34.62, -86.43, 34.83] as const;
export const DEFAULT_MAP_MODE = "terrain" as const;
export const DEFAULT_REFERENCE_STYLE = "civic-atlas" as const;

export const INITIAL_CAMERA = {
  center: [-86.5861, 34.7288] as const,
  zoom: 11.8,
  pitch: 58,
  bearing: 24
} as const;

export const SOURCE_TILE_LOD = {
  dem: {
    maxZoomLevelsOnScreen: 6,
    tileCountMaxMinRatio: 5
  },
  hillshadeDem: {
    maxZoomLevelsOnScreen: 6,
    tileCountMaxMinRatio: 5
  },
  basemap: {
    maxZoomLevelsOnScreen: 5,
    tileCountMaxMinRatio: 4
  }
} as const;

export const NATURAL_SITE_IDS = naturalPlaces.features.map(
  (feature) => feature.properties.id
);
