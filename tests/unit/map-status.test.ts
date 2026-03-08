import { describe, expect, it } from "vitest";
import { buildFallbackStatus, buildMapStatus } from "../../src/map/mapStatus";

describe("map status", () => {
  it("hides the steady-state badge in reference mode", () => {
    expect(buildMapStatus({ phase: "ready", mapMode: "reference" })).toBeNull();
  });

  it("shows explicit badges for non-reference modes", () => {
    expect(buildMapStatus({ phase: "ready", mapMode: "terrain" })).toEqual({
      tone: "ready",
      message: "Terrain mode"
    });
    expect(buildMapStatus({ phase: "ready", mapMode: "relief-model" })).toEqual({
      tone: "ready",
      message: "Relief model"
    });
  });

  it("mentions the saved mode when terrain falls back", () => {
    expect(buildFallbackStatus("relief-model")).toEqual({
      tone: "error",
      message: "Terrain view unavailable in this browser context · Relief model"
    });
  });
});
