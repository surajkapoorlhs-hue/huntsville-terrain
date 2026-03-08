import type { PropertyValueSpecification, StyleSpecification } from "maplibre-gl";
import { curatedPlaces } from "../data/curatedPlaces";
import {
  DEFAULT_MAP_MODE,
  DEFAULT_REFERENCE_STYLE,
  HUNTSVILLE_CORE_BOUNDS
} from "./huntsvilleMapConfig";
import type { MapMode, ReferenceStyle } from "./mapModes";

type ModeProfile = {
  terrainExaggeration: number;
  hillshadeExaggeration: number;
  rasterOpacity: number;
  rasterSaturation: number;
  rasterContrast: number;
  rasterBrightnessMin: number;
  rasterBrightnessMax: number;
  hillshadeHighlightColor: string;
  hillshadeShadowColor: string;
  hillshadeAccentColor: string;
};

type PaintValue = PropertyValueSpecification<number>;

export const REFERENCE_STYLE_PROFILES = {
  "civic-atlas": {
    terrainExaggeration: 1.05,
    hillshadeExaggeration: 0.32,
    rasterOpacity: 0.96,
    rasterSaturation: -0.04,
    rasterContrast: 0.08,
    rasterBrightnessMin: 0.28,
    rasterBrightnessMax: 0.99,
    hillshadeHighlightColor: "#f5f4ee",
    hillshadeShadowColor: "#8b9487",
    hillshadeAccentColor: "#d7ddd2"
  },
  "natural-paper": {
    terrainExaggeration: 1.14,
    hillshadeExaggeration: 0.44,
    rasterOpacity: 0.9,
    rasterSaturation: -0.18,
    rasterContrast: 0.1,
    rasterBrightnessMin: 0.24,
    rasterBrightnessMax: 0.93,
    hillshadeHighlightColor: "#f7f2e7",
    hillshadeShadowColor: "#8e8878",
    hillshadeAccentColor: "#d9cfbf"
  }
} as const satisfies Record<ReferenceStyle, ModeProfile>;

export const MAP_MODE_PROFILES = {
  terrain: {
    terrainExaggeration: 1.72,
    hillshadeExaggeration: 0.92,
    rasterOpacity: 0.62,
    rasterSaturation: -0.58,
    rasterContrast: 0.28,
    rasterBrightnessMin: 0.12,
    rasterBrightnessMax: 0.76,
    hillshadeHighlightColor: "#fffef8",
    hillshadeShadowColor: "#68735f",
    hillshadeAccentColor: "#b8c0b0"
  },
  topo: {
    terrainExaggeration: 1.36,
    hillshadeExaggeration: 0.78,
    rasterOpacity: 0.52,
    rasterSaturation: -0.74,
    rasterContrast: 0.22,
    rasterBrightnessMin: 0.12,
    rasterBrightnessMax: 0.72,
    hillshadeHighlightColor: "#fdfcf6",
    hillshadeShadowColor: "#66705f",
    hillshadeAccentColor: "#b8c1b2"
  },
  "relief-model": {
    terrainExaggeration: 3.6,
    hillshadeExaggeration: 2.05,
    rasterOpacity: 0.18,
    rasterSaturation: -1,
    rasterContrast: 0.58,
    rasterBrightnessMin: 0.04,
    rasterBrightnessMax: 0.48,
    hillshadeHighlightColor: "#faf9f3",
    hillshadeShadowColor: "#4e564d",
    hillshadeAccentColor: "#a2a9a2"
  }
} as const satisfies Record<Exclude<MapMode, "reference">, ModeProfile>;

export function resolveModeProfile(
  mapMode: MapMode,
  referenceStyle: ReferenceStyle
): ModeProfile {
  if (mapMode === "reference") {
    return REFERENCE_STYLE_PROFILES[referenceStyle];
  }

  return MAP_MODE_PROFILES[mapMode];
}

export function getRasterOpacityPaint(
  mapMode: MapMode,
  profile: ModeProfile
): PaintValue {
  if (mapMode === "terrain") {
    return [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      0.5,
      12.5,
      0.56,
      15,
      0.64
    ];
  }

  return profile.rasterOpacity;
}

export function getHillshadeExaggerationPaint(
  mapMode: MapMode,
  profile: ModeProfile
): PaintValue {
  if (mapMode === "terrain") {
    return [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      1.22,
      12.5,
      1.04,
      15,
      0.86
    ];
  }

  return profile.hillshadeExaggeration;
}

export function getHillshadeHighlightColor(
  mapMode: MapMode,
  profile: ModeProfile
): string {
  if (mapMode === "terrain") {
    return "#f4f5ee";
  }

  return profile.hillshadeHighlightColor;
}

export function getHillshadeShadowColor(
  mapMode: MapMode,
  profile: ModeProfile
): string {
  if (mapMode === "terrain") {
    return "#55604d";
  }

  return profile.hillshadeShadowColor;
}

export function getHillshadeAccentColor(
  mapMode: MapMode,
  profile: ModeProfile
): string {
  if (mapMode === "terrain") {
    return "#afb8ab";
  }

  return profile.hillshadeAccentColor;
}

export function buildTerrainStyle(
  mapMode: MapMode = DEFAULT_MAP_MODE,
  referenceStyle: ReferenceStyle = DEFAULT_REFERENCE_STYLE
): StyleSpecification {
  const profile = resolveModeProfile(mapMode, referenceStyle);

  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      dem: {
        type: "raster-dem",
        tiles: ["/generated/terrain/tiles/{z}/{x}/{y}.png"],
        tileSize: 512,
        encoding: "terrarium",
        minzoom: 8,
        bounds: [...HUNTSVILLE_CORE_BOUNDS],
        maxzoom: 15
      },
      "hillshade-dem": {
        type: "raster-dem",
        tiles: ["/generated/terrain/tiles/{z}/{x}/{y}.png"],
        tileSize: 512,
        encoding: "terrarium",
        minzoom: 8,
        bounds: [...HUNTSVILLE_CORE_BOUNDS],
        maxzoom: 15
      },
      basemap: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "OpenStreetMap"
      },
      sites: {
        type: "geojson",
        data: curatedPlaces
      },
      "saved-homes": {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      },
      contours: {
        type: "geojson",
        data: "/generated/terrain/contours.geojson"
      },
      streams: {
        type: "geojson",
        data: "/generated/overlays/streams.geojson"
      },
      parks: {
        type: "geojson",
        data: "/generated/overlays/parks.geojson"
      },
      trails: {
        type: "geojson",
        data: "/generated/overlays/trails.geojson"
      }
    },
    terrain: {
      source: "dem",
      exaggeration: profile.terrainExaggeration
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#eef2e7"
        }
      },
      {
        id: "basemap-raster",
        type: "raster",
        source: "basemap",
        paint: {
          "raster-opacity": getRasterOpacityPaint(mapMode, profile),
          "raster-saturation": profile.rasterSaturation,
          "raster-contrast": profile.rasterContrast,
          "raster-brightness-min": profile.rasterBrightnessMin,
          "raster-brightness-max": profile.rasterBrightnessMax
        }
      },
      {
        id: "terrain-hillshade",
        type: "hillshade",
        source: "hillshade-dem",
        paint: {
          "hillshade-highlight-color": getHillshadeHighlightColor(
            mapMode,
            profile
          ),
          "hillshade-shadow-color": getHillshadeShadowColor(mapMode, profile),
          "hillshade-accent-color": getHillshadeAccentColor(mapMode, profile),
          "hillshade-exaggeration": getHillshadeExaggerationPaint(
            mapMode,
            profile
          )
        }
      },
      {
        id: "contour-line",
        type: "line",
        source: "contours",
        layout: {
          visibility: mapMode === "topo" ? "visible" : "none"
        },
        paint: {
          "line-color": "#6b7567",
          "line-width": 1,
          "line-opacity": 0.48
        }
      },
      {
        id: "streams-casing",
        type: "line",
        source: "streams",
        layout: {
          visibility: "visible"
        },
        paint: {
          "line-color": "#eef5f8",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.1, 15, 4.1],
          "line-opacity": 0.46
        }
      },
      {
        id: "streams-line",
        type: "line",
        source: "streams",
        layout: {
          visibility: "visible"
        },
        paint: {
          "line-color": "#4c91ab",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.35, 15, 2.8],
          "line-opacity": 0.88
        }
      },
      {
        id: "parks-fill",
        type: "fill",
        source: "parks",
        layout: {
          visibility: "visible"
        },
        paint: {
          "fill-color": "#c6933f",
          "fill-opacity": 0.24,
          "fill-outline-color": "#7d5728"
        }
      },
      {
        id: "trails-casing",
        type: "line",
        source: "trails",
        layout: {
          visibility: "none"
        },
        paint: {
          "line-color": "#f4e9d6",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.95, 15, 3.2],
          "line-opacity": 0.38
        }
      },
      {
        id: "trails-line",
        type: "line",
        source: "trails",
        layout: {
          visibility: "none"
        },
        paint: {
          "line-color": "#7a5a31",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 15, 2.3],
          "line-opacity": 0.86,
          "line-dasharray": [2, 1.5]
        }
      },
      {
        id: "site-aura",
        type: "circle",
        source: "sites",
        paint: {
          "circle-radius": 12,
          "circle-color": [
            "case",
            ["==", ["get", "placeType"], "practical"],
            "#6f7d9a",
            "#3b6f52"
          ],
          "circle-opacity": 0.14
        }
      },
      {
        id: "site-marker",
        type: "circle",
        source: "sites",
        paint: {
          "circle-radius": 5,
          "circle-color": [
            "case",
            ["==", ["get", "placeType"], "practical"],
            "#5d7592",
            "#315942"
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#f7f4eb"
        }
      },
      {
        id: "site-label",
        type: "symbol",
        source: "sites",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-offset": [0, 1.3]
        },
        paint: {
          "text-color": "#294132",
          "text-halo-color": "#f7f4eb",
          "text-halo-width": 1
        }
      },
      {
        id: "home-marker",
        type: "circle",
        source: "saved-homes",
        paint: {
          "circle-radius": 6,
          "circle-color": "#b34741",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff4ef"
        }
      },
      {
        id: "home-label",
        type: "symbol",
        source: "saved-homes",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-offset": [0, 1.15]
        },
        paint: {
          "text-color": "#6e2a25",
          "text-halo-color": "rgba(255, 248, 244, 0.94)",
          "text-halo-width": 1.2
        }
      }
    ]
  };
}
