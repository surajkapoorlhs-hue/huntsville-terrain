export const MAP_MODES = ["reference", "terrain", "topo", "relief-model"] as const;
export const REFERENCE_STYLES = ["civic-atlas", "natural-paper"] as const;

export type MapMode = (typeof MAP_MODES)[number];
export type ReferenceStyle = (typeof REFERENCE_STYLES)[number];

export const MAP_MODE_LABELS: Record<MapMode, string> = {
  reference: "Reference",
  terrain: "Terrain",
  topo: "Topo",
  "relief-model": "Relief Model"
};

export const REFERENCE_STYLE_LABELS: Record<ReferenceStyle, string> = {
  "civic-atlas": "Civic Atlas",
  "natural-paper": "Natural Paper"
};

export function isMapMode(value: string): value is MapMode {
  return MAP_MODES.includes(value as MapMode);
}

export function isReferenceStyle(value: string): value is ReferenceStyle {
  return REFERENCE_STYLES.includes(value as ReferenceStyle);
}
