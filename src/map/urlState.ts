import type { CuratedPlaceId } from "../data/curatedPlaces";
import { curatedPlaceById } from "../data/curatedPlaces";
import type { MapMode, ReferenceStyle } from "./mapModes";
import { isMapMode, isReferenceStyle } from "./mapModes";

export type MapCameraState = {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

export type MapUrlState = {
  siteId?: CuratedPlaceId;
  mapMode?: MapMode;
  referenceStyle?: ReferenceStyle;
  camera?: MapCameraState;
};

function toUrl(input: string) {
  return new URL(input, "https://huntsville-terrain.local");
}

function parseNumber(value: string | null) {
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseUrlState(input: string): MapUrlState {
  const url = toUrl(input);
  const siteParam = url.searchParams.get("site");
  const modeParam = url.searchParams.get("mode");
  const refStyleParam = url.searchParams.get("refStyle");

  const lng = parseNumber(url.searchParams.get("lng"));
  const lat = parseNumber(url.searchParams.get("lat"));
  const zoom = parseNumber(url.searchParams.get("z"));
  const pitch = parseNumber(url.searchParams.get("pitch"));
  const bearing = parseNumber(url.searchParams.get("bearing"));

  const state: MapUrlState = {};

  if (siteParam && curatedPlaceById.has(siteParam as CuratedPlaceId)) {
    state.siteId = siteParam as CuratedPlaceId;
  }

  if (modeParam && isMapMode(modeParam)) {
    state.mapMode = modeParam;
  }

  if (refStyleParam && isReferenceStyle(refStyleParam)) {
    state.referenceStyle = refStyleParam;
  }

  if (
    lng !== null &&
    lat !== null &&
    zoom !== null &&
    pitch !== null &&
    bearing !== null
  ) {
    state.camera = { lng, lat, zoom, pitch, bearing };
  }

  return state;
}

export function stringifyUrlState(
  state: MapUrlState,
  baseHref = "https://huntsville-terrain.local/"
) {
  const url = toUrl(baseHref);
  url.search = "";

  if (state.siteId) {
    url.searchParams.set("site", state.siteId);
  }

  if (state.mapMode && state.mapMode !== "reference") {
    url.searchParams.set("mode", state.mapMode);
  }

  if (state.referenceStyle && state.referenceStyle !== "civic-atlas") {
    url.searchParams.set("refStyle", state.referenceStyle);
  }

  if (state.camera) {
    url.searchParams.set("lng", state.camera.lng.toFixed(5));
    url.searchParams.set("lat", state.camera.lat.toFixed(5));
    url.searchParams.set("z", state.camera.zoom.toFixed(2));
    url.searchParams.set("pitch", state.camera.pitch.toFixed(1));
    url.searchParams.set("bearing", state.camera.bearing.toFixed(1));
  }

  return url.toString();
}
