import type { MapMode } from "./mapModes";

export type MapStatusTone = "loading" | "ready" | "error";

export type MapStatus = {
  tone: MapStatusTone;
  message: string;
};

export function buildMapStatus(input: {
  phase: MapStatusTone;
  mapMode: MapMode;
}): MapStatus | null {
  if (input.phase === "loading") {
    return {
      tone: "loading",
      message: "Loading terrain map…"
    };
  }

  if (input.phase === "error") {
    return {
      tone: "error",
      message: "Map data issue detected"
    };
  }

  if (input.mapMode === "terrain") {
    return {
      tone: "ready",
      message: "Terrain mode"
    };
  }

  if (input.mapMode === "topo") {
    return {
      tone: "ready",
      message: "Topo mode"
    };
  }

  if (input.mapMode === "reference") {
    return null;
  }

  if (input.mapMode === "relief-model") {
    return {
      tone: "ready",
      message: "Relief model"
    };
  }

  return null;
}

export function buildFallbackStatus(mapMode: MapMode): MapStatus {
  return {
    tone: "error",
    message:
      mapMode === "reference"
        ? "Terrain view unavailable in this browser context."
        : `Terrain view unavailable in this browser context · ${
            mapMode === "terrain"
              ? "Terrain mode"
              : mapMode === "topo"
                ? "Topo mode"
                : "Relief model"
          }`
  };
}
