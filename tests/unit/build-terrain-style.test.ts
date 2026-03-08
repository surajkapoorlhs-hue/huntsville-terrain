import { describe, expect, it } from "vitest";
import {
  MAP_MODE_PROFILES,
  REFERENCE_STYLE_PROFILES,
  buildTerrainStyle
} from "../../src/map/buildTerrainStyle";

describe("terrain style builder", () => {
  it("creates terrain, vector, and site sources", () => {
    const style = buildTerrainStyle();

    expect(style.version).toBe(8);
    expect(style.sources.dem.type).toBe("raster-dem");
    expect(style.sources["hillshade-dem"].type).toBe("raster-dem");
    expect(style.sources.sites.type).toBe("geojson");
    expect(style.terrain?.source).toBe("dem");
    expect(style.terrain?.exaggeration).toBe(
      MAP_MODE_PROFILES.terrain.terrainExaggeration
    );
    if (style.sources.dem.type !== "raster-dem") {
      return;
    }

    expect(style.sources.dem.tiles?.[0]).toContain("/generated/terrain/tiles/");
    expect(style.sources.dem.tileSize).toBe(512);
    expect(style.sources.dem.minzoom).toBe(8);
    expect(style.sources.dem.bounds).toEqual([-86.72, 34.62, -86.43, 34.83]);
    if (style.sources["hillshade-dem"].type !== "raster-dem") {
      return;
    }

    expect(style.sources["hillshade-dem"].tiles?.[0]).toContain(
      "/generated/terrain/tiles/"
    );
    expect(style.sources["hillshade-dem"].tileSize).toBe(512);
    expect(style.sources["hillshade-dem"].minzoom).toBe(8);
    expect(style.sources["hillshade-dem"].bounds).toEqual([
      -86.72,
      34.62,
      -86.43,
      34.83
    ]);
  });

  it("keeps raster paint values within MapLibre's valid range", () => {
    const style = buildTerrainStyle();
    const rasterLayer = style.layers.find((layer) => layer.id === "basemap-raster");

    expect(rasterLayer?.type).toBe("raster");
    if (rasterLayer?.type !== "raster") {
      return;
    }

    expect(rasterLayer.paint?.["raster-brightness-max"]).toBeLessThanOrEqual(1);
  });

  it("ships with attribution and a balanced reference terrain style", () => {
    const style = buildTerrainStyle("reference");
    const hillshadeLayer = style.layers.find(
      (layer) => layer.id === "terrain-hillshade"
    );

    expect(style.sources.basemap.type).toBe("raster");
    if (style.sources.basemap.type !== "raster") {
      return;
    }

    expect(style.sources.basemap.attribution).toContain("OpenStreetMap");
    expect(style.terrain?.exaggeration).toBeGreaterThan(1);

    expect(hillshadeLayer?.type).toBe("hillshade");
    if (hillshadeLayer?.type !== "hillshade") {
      return;
    }

    expect(hillshadeLayer.paint?.["hillshade-exaggeration"]).toBeGreaterThan(0.2);
  });

  it("makes terrain and relief-model modes materially stronger than reference", () => {
    expect(MAP_MODE_PROFILES.terrain.terrainExaggeration).toBeGreaterThan(
      REFERENCE_STYLE_PROFILES["civic-atlas"].terrainExaggeration
    );
    expect(MAP_MODE_PROFILES["relief-model"].terrainExaggeration).toBeGreaterThan(
      MAP_MODE_PROFILES.terrain.terrainExaggeration
    );
    expect(MAP_MODE_PROFILES.terrain.hillshadeExaggeration).toBeGreaterThan(
      REFERENCE_STYLE_PROFILES["civic-atlas"].hillshadeExaggeration
    );
    expect(MAP_MODE_PROFILES["relief-model"].rasterOpacity).toBeLessThan(
      MAP_MODE_PROFILES.terrain.rasterOpacity
    );
    expect(MAP_MODE_PROFILES["relief-model"].rasterSaturation).toBeLessThan(
      MAP_MODE_PROFILES.terrain.rasterSaturation
    );
  });

  it("gives civic-atlas and natural-paper distinct reference treatments", () => {
    expect(REFERENCE_STYLE_PROFILES["civic-atlas"].rasterSaturation).toBeGreaterThan(
      REFERENCE_STYLE_PROFILES["natural-paper"].rasterSaturation
    );
    expect(
      REFERENCE_STYLE_PROFILES["natural-paper"].hillshadeExaggeration
    ).toBeGreaterThan(REFERENCE_STYLE_PROFILES["civic-atlas"].hillshadeExaggeration);
  });

  it("wires a contour source into topo mode", () => {
    const style = buildTerrainStyle("topo");

    expect(style.sources.contours.type).toBe("geojson");
    expect(style.layers.some((layer) => layer.id === "contour-line")).toBe(true);
  });

  it("uses a higher-contrast preserves and parks treatment", () => {
    const style = buildTerrainStyle("terrain");
    const parksLayer = style.layers.find((layer) => layer.id === "parks-fill");

    expect(parksLayer?.type).toBe("fill");
    if (parksLayer?.type !== "fill") {
      return;
    }

    expect(parksLayer.paint?.["fill-color"]).toBe("#c6933f");
    expect(parksLayer.paint?.["fill-opacity"]).toBeGreaterThanOrEqual(0.22);
  });

  it("makes streams and trails more conspicuous without overpowering the map", () => {
    const style = buildTerrainStyle("terrain");
    const streamsLayer = style.layers.find((layer) => layer.id === "streams-line");
    const trailsLayer = style.layers.find((layer) => layer.id === "trails-line");

    expect(streamsLayer?.type).toBe("line");
    expect(trailsLayer?.type).toBe("line");
    if (streamsLayer?.type !== "line" || trailsLayer?.type !== "line") {
      return;
    }

    expect(streamsLayer.paint?.["line-width"]).toEqual(["interpolate", ["linear"], ["zoom"], 10, 1.35, 15, 2.8]);
    expect(streamsLayer.paint?.["line-opacity"]).toBeGreaterThanOrEqual(0.84);
    expect(trailsLayer.paint?.["line-width"]).toEqual(["interpolate", ["linear"], ["zoom"], 10, 1.2, 15, 2.3]);
    expect(trailsLayer.paint?.["line-opacity"]).toBeGreaterThanOrEqual(0.84);
  });

  it("uses zoom-aware terrain shading so overview relief reads more strongly", () => {
    const style = buildTerrainStyle("terrain");
    const rasterLayer = style.layers.find((layer) => layer.id === "basemap-raster");
    const hillshadeLayer = style.layers.find(
      (layer) => layer.id === "terrain-hillshade"
    );

    expect(rasterLayer?.type).toBe("raster");
    expect(hillshadeLayer?.type).toBe("hillshade");
    if (rasterLayer?.type !== "raster" || hillshadeLayer?.type !== "hillshade") {
      return;
    }

    expect(rasterLayer.paint?.["raster-opacity"]).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      0.5,
      12.5,
      0.56,
      15,
      0.64
    ]);
    expect(hillshadeLayer.paint?.["hillshade-exaggeration"]).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      1.22,
      12.5,
      1.04,
      15,
      0.86
    ]);
    expect(hillshadeLayer.paint?.["hillshade-highlight-color"]).toBe("#f4f5ee");
    expect(hillshadeLayer.paint?.["hillshade-shadow-color"]).toBe("#55604d");
  });
});
