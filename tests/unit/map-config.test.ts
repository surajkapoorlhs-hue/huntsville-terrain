import { describe, expect, it } from "vitest";
import {
  HUNTSVILLE_CORE_BOUNDS,
  INITIAL_CAMERA,
  NATURAL_SITE_IDS
} from "../../src/map/huntsvilleMapConfig";

describe("huntsville terrain config", () => {
  it("pins the map to Huntsville core and exposes curated sites", () => {
    expect(HUNTSVILLE_CORE_BOUNDS).toHaveLength(4);
    expect(INITIAL_CAMERA.pitch).toBeGreaterThan(40);
    expect(NATURAL_SITE_IDS).toContain("monte-sano-state-park");
    expect(NATURAL_SITE_IDS.length).toBeGreaterThanOrEqual(5);
  });
});
