import { describe, expect, it } from "vitest";
import { parseUrlState, stringifyUrlState } from "../../src/map/urlState";

describe("map url state", () => {
  it("round-trips selected site and camera params", () => {
    const url = stringifyUrlState({
      siteId: "huntsville-hospital",
      mapMode: "relief-model",
      referenceStyle: "natural-paper",
      camera: {
        lng: -86.53,
        lat: 34.74,
        zoom: 12.4,
        pitch: 58,
        bearing: 22
      }
    });

    const parsed = parseUrlState(url);
    expect(parsed.siteId).toBe("huntsville-hospital");
    expect(parsed.mapMode).toBe("relief-model");
    expect(parsed.referenceStyle).toBe("natural-paper");
    expect(parsed.camera?.zoom).toBe(12.4);
  });
});
