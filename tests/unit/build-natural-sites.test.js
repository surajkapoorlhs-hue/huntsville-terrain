import { describe, expect, it } from "vitest";
import { buildNaturalSitesFeatureCollection } from "../../scripts/build-natural-sites.mjs";

describe("natural site build script", () => {
  it("normalizes authored yaml into geojson", () => {
    const collection = buildNaturalSitesFeatureCollection([
      {
        id: "monte-sano-state-park",
        name: "Monte Sano State Park",
        category: "park",
        description: "Terrain anchor",
        coordinates: [-86.53, 34.75]
      }
    ]);

    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features[0].properties.id).toBe("monte-sano-state-park");
  });
});
