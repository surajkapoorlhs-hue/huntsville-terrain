import { startTransition, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { curatedPlaceById, type CuratedPlaceId } from "../data/curatedPlaces";
import { useMapUiStore, type SavedHome } from "../store/mapUiStore";
import {
  buildTerrainStyle,
  getHillshadeAccentColor,
  getHillshadeExaggerationPaint,
  getHillshadeHighlightColor,
  getHillshadeShadowColor,
  getRasterOpacityPaint,
  resolveModeProfile
} from "./buildTerrainStyle";
import {
  DEFAULT_MAP_MODE,
  DEFAULT_REFERENCE_STYLE,
  HUNTSVILLE_CORE_BOUNDS,
  INITIAL_CAMERA,
  SOURCE_TILE_LOD
} from "./huntsvilleMapConfig";
import {
  MAP_MODE_LABELS,
  REFERENCE_STYLE_LABELS,
  type MapMode,
  type ReferenceStyle
} from "./mapModes";
import {
  buildFallbackStatus,
  buildMapStatus,
  type MapStatus
} from "./mapStatus";
import {
  parseUrlState,
  stringifyUrlState,
  type MapCameraState
} from "./urlState";

const MAX_BOUNDS: [[number, number], [number, number]] = [
  [HUNTSVILLE_CORE_BOUNDS[0], HUNTSVILLE_CORE_BOUNDS[1]],
  [HUNTSVILLE_CORE_BOUNDS[2], HUNTSVILLE_CORE_BOUNDS[3]]
];

type MapErrorEvent = {
  error?: {
    name?: string;
    message?: string;
  };
  sourceId?: string;
  tile?: unknown;
};

function shouldIgnoreMapError(event: MapErrorEvent): boolean {
  if (!event.error) {
    return true;
  }

  if (event.error.name === "AbortError") {
    return true;
  }

  return (
    typeof event.error.message === "string" &&
    event.error.message.includes(
      "same source for a hillshade layer and for 3D terrain"
    )
  );
}

export function MapView() {
  const initialUrlState =
    typeof window === "undefined" ? {} : parseUrlState(window.location.href);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isMapReadyRef = useRef(false);
  const selectedPlaceIdRef = useRef<CuratedPlaceId | null>(null);
  const selectedHomeIdRef = useRef<string | null>(null);
  const savedHomesRef = useRef<SavedHome[]>([]);
  const mapModeRef = useRef<MapMode>(initialUrlState.mapMode ?? DEFAULT_MAP_MODE);
  const referenceStyleRef = useRef<ReferenceStyle>(
    initialUrlState.referenceStyle ?? DEFAULT_REFERENCE_STYLE
  );
  const overlaysRef = useRef({
    streams: true,
    parks: true,
    sites: true,
    trails: false
  });
  const initialUrlStateRef = useRef(initialUrlState);
  const cameraStateRef = useRef<MapCameraState>(
    initialUrlState.camera ?? {
      lng: INITIAL_CAMERA.center[0],
      lat: INITIAL_CAMERA.center[1],
      zoom: INITIAL_CAMERA.zoom,
      pitch: INITIAL_CAMERA.pitch,
      bearing: INITIAL_CAMERA.bearing
    }
  );
  const [isFallback, setIsFallback] = useState(false);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [mapStatus, setMapStatus] = useState<MapStatus | null>(
    buildMapStatus({
      phase: "loading",
      mapMode: initialUrlState.mapMode ?? DEFAULT_MAP_MODE
    })
  );
  const selectedPlaceId = useMapUiStore((state) => state.selectedPlaceId);
  const selectedHomeId = useMapUiStore((state) => state.selectedHomeId);
  const savedHomes = useMapUiStore((state) => state.savedHomes);
  const mapMode = useMapUiStore((state) => state.mapMode);
  const referenceStyle = useMapUiStore((state) => state.referenceStyle);
  const overlays = useMapUiStore((state) => state.overlays);
  const selectPlace = useMapUiStore((state) => state.selectPlace);
  const selectHome = useMapUiStore((state) => state.selectHome);
  const setMapMode = useMapUiStore((state) => state.setMapMode);
  const setReferenceStyle = useMapUiStore((state) => state.setReferenceStyle);

  function syncUrl(map = mapRef.current) {
    if (typeof window === "undefined") {
      return;
    }

    if (map) {
      const center = map.getCenter();
      cameraStateRef.current = {
        lng: center.lng,
        lat: center.lat,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing()
      };
    }

    const nextUrl = stringifyUrlState(
      {
        siteId: selectedPlaceIdRef.current ?? undefined,
        mapMode: mapModeRef.current,
        referenceStyle: referenceStyleRef.current,
        camera: cameraStateRef.current
      },
      window.location.href
    );

    window.history.replaceState(null, "", nextUrl);
  }

  function applyMapMode(map = mapRef.current) {
    if (!map || !isMapReadyRef.current) {
      syncUrl(map);
      return;
    }

    const profile = resolveModeProfile(
      mapModeRef.current,
      referenceStyleRef.current
    );

    map.setTerrain({
      source: "dem",
      exaggeration: profile.terrainExaggeration
    });

    if (map.getLayer("terrain-hillshade")) {
      map.setPaintProperty(
        "terrain-hillshade",
        "hillshade-highlight-color",
        getHillshadeHighlightColor(mapModeRef.current, profile)
      );
      map.setPaintProperty(
        "terrain-hillshade",
        "hillshade-shadow-color",
        getHillshadeShadowColor(mapModeRef.current, profile)
      );
      map.setPaintProperty(
        "terrain-hillshade",
        "hillshade-accent-color",
        getHillshadeAccentColor(mapModeRef.current, profile)
      );
      map.setPaintProperty(
        "terrain-hillshade",
        "hillshade-exaggeration",
        getHillshadeExaggerationPaint(mapModeRef.current, profile)
      );
    }

    if (map.getLayer("basemap-raster")) {
      map.setPaintProperty(
        "basemap-raster",
        "raster-opacity",
        getRasterOpacityPaint(mapModeRef.current, profile)
      );
      map.setPaintProperty(
        "basemap-raster",
        "raster-saturation",
        profile.rasterSaturation
      );
      map.setPaintProperty(
        "basemap-raster",
        "raster-contrast",
        profile.rasterContrast
      );
      map.setPaintProperty(
        "basemap-raster",
        "raster-brightness-min",
        profile.rasterBrightnessMin
      );
      map.setPaintProperty(
        "basemap-raster",
        "raster-brightness-max",
        profile.rasterBrightnessMax
      );
    }

    if (map.getLayer("contour-line")) {
      map.setLayoutProperty(
        "contour-line",
        "visibility",
        mapModeRef.current === "topo" ? "visible" : "none"
      );
    }

    setMapStatus(buildMapStatus({ phase: "ready", mapMode: mapModeRef.current }));

    syncUrl(map);
  }

  function applyOverlayVisibility(map = mapRef.current) {
    if (!map || !isMapReadyRef.current) {
      return;
    }

    const visibilityFor = (enabled: boolean) => (enabled ? "visible" : "none");

    const streamsVisibility = visibilityFor(overlaysRef.current.streams);
    for (const layerId of ["streams-casing", "streams-line"]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", streamsVisibility);
      }
    }

    if (map.getLayer("parks-fill")) {
      map.setLayoutProperty(
        "parks-fill",
        "visibility",
        visibilityFor(overlaysRef.current.parks)
      );
    }

    const trailsVisibility = visibilityFor(overlaysRef.current.trails);
    for (const layerId of ["trails-casing", "trails-line"]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", trailsVisibility);
      }
    }

    const sitesVisibility = visibilityFor(overlaysRef.current.sites);
    for (const layerId of ["site-aura", "site-marker", "site-label"]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", sitesVisibility);
      }
    }
  }

  function buildSavedHomesGeoJson() {
    return {
      type: "FeatureCollection" as const,
      features: savedHomesRef.current.map((home) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: home.coordinates
        },
        properties: {
          id: home.id,
          label: home.label,
          address: home.address
        }
      }))
    };
  }

  function applySavedHomes(map = mapRef.current) {
    if (!map || !isMapReadyRef.current) {
      return;
    }

    const homesSource = map.getSource("saved-homes");
    if (homesSource && "setData" in homesSource) {
      (
        homesSource as {
          setData: (data: ReturnType<typeof buildSavedHomesGeoJson>) => void;
        }
      ).setData(buildSavedHomesGeoJson());
    }
  }

  function applySelectedFeature(map = mapRef.current) {
    if (!map || !isMapReadyRef.current) {
      syncUrl(map);
      return;
    }

    if (map.getLayer("site-marker")) {
      map.setPaintProperty("site-marker", "circle-color", [
        "case",
        ["==", ["get", "id"], selectedPlaceIdRef.current ?? ""],
        ["case", ["==", ["get", "placeType"], "practical"], "#d6a15b", "#d67746"],
        ["==", ["get", "placeType"], "practical"],
        "#5d7592",
        "#315942"
      ]);
      map.setPaintProperty("site-marker", "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedPlaceIdRef.current ?? ""],
        7,
        5
      ]);
    }

    if (map.getLayer("site-aura")) {
      map.setPaintProperty("site-aura", "circle-color", [
        "case",
        ["==", ["get", "id"], selectedPlaceIdRef.current ?? ""],
        ["case", ["==", ["get", "placeType"], "practical"], "#d1b080", "#3f7d59"],
        ["==", ["get", "placeType"], "practical"],
        "#6f7d9a",
        "#3b6f52"
      ]);
    }

    if (map.getLayer("home-marker")) {
      map.setPaintProperty("home-marker", "circle-color", [
        "case",
        ["==", ["get", "id"], selectedHomeIdRef.current ?? ""],
        "#d0463c",
        "#b34741"
      ]);
      map.setPaintProperty("home-marker", "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedHomeIdRef.current ?? ""],
        8,
        6
      ]);
    }

    if (selectedHomeIdRef.current) {
      const selectedHome = savedHomesRef.current.find(
        (home) => home.id === selectedHomeIdRef.current
      );
      if (selectedHome) {
        map.flyTo({
          center: selectedHome.coordinates,
          zoom: Math.max(map.getZoom(), 12.8),
          essential: !prefersReducedMotion,
          duration: prefersReducedMotion ? 0 : 900
        });
      }
      syncUrl(map);
      return;
    }

    if (!selectedPlaceIdRef.current) {
      syncUrl(map);
      return;
    }

    const selectedPlace = curatedPlaceById.get(selectedPlaceIdRef.current);
    if (!selectedPlace) {
      syncUrl(map);
      return;
    }

    map.flyTo({
      center: selectedPlace.geometry.coordinates,
      zoom: Math.max(map.getZoom(), 12.8),
      essential: !prefersReducedMotion,
      duration: prefersReducedMotion ? 0 : 900
    });

    syncUrl(map);
  }

  useEffect(() => {
    selectedPlaceIdRef.current = selectedPlaceId;
  }, [selectedPlaceId]);

  useEffect(() => {
    selectedHomeIdRef.current = selectedHomeId;
  }, [selectedHomeId]);

  useEffect(() => {
    savedHomesRef.current = savedHomes;
  }, [savedHomes]);

  useEffect(() => {
    mapModeRef.current = mapMode;
    if (isFallback) {
      setMapStatus(buildFallbackStatus(mapMode));
    }
  }, [isFallback, mapMode]);

  useEffect(() => {
    referenceStyleRef.current = referenceStyle;
  }, [referenceStyle]);

  useEffect(() => {
    overlaysRef.current = overlays;
  }, [overlays]);

  useEffect(() => {
    const initialUrlState = initialUrlStateRef.current;

    if (initialUrlState.siteId) {
      selectPlace(initialUrlState.siteId);
    }

    if (initialUrlState.mapMode) {
      setMapMode(initialUrlState.mapMode);
    }
    if (initialUrlState.referenceStyle) {
      setReferenceStyle(initialUrlState.referenceStyle);
    }
  }, [selectPlace, setMapMode, setReferenceStyle]);

  useEffect(() => {
    if (!containerRef.current || isFallback) {
      return;
    }

    let map: maplibregl.Map | null = null;
    const initialCamera = cameraStateRef.current;

    try {
      setMapStatus(buildMapStatus({ phase: "loading", mapMode: mapModeRef.current }));

      map = new maplibregl.Map({
        container: containerRef.current,
        style: buildTerrainStyle(mapModeRef.current, referenceStyleRef.current),
        center: [initialCamera.lng, initialCamera.lat],
        zoom: initialCamera.zoom,
        pitch: initialCamera.pitch,
        bearing: initialCamera.bearing,
        minZoom: 10,
        maxZoom: 15.5,
        maxBounds: MAX_BOUNDS,
        cooperativeGestures: true,
        attributionControl: {
          compact: true
        }
      });

      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true }),
        "bottom-right"
      );
      mapRef.current = map;
      isMapReadyRef.current = false;

      map.on("error", (event) => {
        if (shouldIgnoreMapError(event as MapErrorEvent)) {
          return;
        }

        setMapStatus(buildMapStatus({ phase: "error", mapMode: mapModeRef.current }));
      });

      map.on("load", () => {
        isMapReadyRef.current = true;
        map?.setSourceTileLodParams(
          SOURCE_TILE_LOD.dem.maxZoomLevelsOnScreen,
          SOURCE_TILE_LOD.dem.tileCountMaxMinRatio,
          "dem"
        );
        map?.setSourceTileLodParams(
          SOURCE_TILE_LOD.hillshadeDem.maxZoomLevelsOnScreen,
          SOURCE_TILE_LOD.hillshadeDem.tileCountMaxMinRatio,
          "hillshade-dem"
        );
        map?.setSourceTileLodParams(
          SOURCE_TILE_LOD.basemap.maxZoomLevelsOnScreen,
          SOURCE_TILE_LOD.basemap.tileCountMaxMinRatio,
          "basemap"
        );
        map?.on("click", "site-marker", (event) => {
          const placeId = event.features?.[0]?.properties?.id;
          if (
            typeof placeId === "string" &&
            curatedPlaceById.has(placeId as CuratedPlaceId)
          ) {
            selectPlace(placeId as CuratedPlaceId);
          }
        });

        map?.on("click", "home-marker", (event) => {
          const homeId = event.features?.[0]?.properties?.id;
          if (typeof homeId === "string") {
            selectHome(homeId);
          }
        });

        map?.on("moveend", () => {
          syncUrl(map);
        });
        map?.on("idle", () => {
          setMapStatus(
            buildMapStatus({
              phase: "ready",
              mapMode: mapModeRef.current
            })
          );
        });

        applyMapMode(map);
        applyOverlayVisibility(map);
        applySavedHomes(map);
        applySelectedFeature(map);
        syncUrl(map);
      });
    } catch {
      startTransition(() => {
        setIsFallback(true);
      });
      setMapStatus(buildFallbackStatus(mapModeRef.current));
    }

    return () => {
      isMapReadyRef.current = false;
      mapRef.current = null;
      map?.remove();
    };
  }, [isFallback, selectHome, selectPlace]);

  useEffect(() => {
    applyMapMode();
  }, [mapMode, referenceStyle]);

  useEffect(() => {
    applySavedHomes();
  }, [savedHomes]);

  useEffect(() => {
    applySelectedFeature();
  }, [selectedPlaceId, selectedHomeId, savedHomes]);

  useEffect(() => {
    applyOverlayVisibility();
  }, [overlays]);

  if (isFallback) {
    return (
      <>
        <div
          data-testid="terrain-map"
          className="map-canvas map-fallback"
          tabIndex={0}
        >
          <div className="map-fallback-copy">
            <strong>Terrain view unavailable in this browser context.</strong>
            <span>
              The explorer is showing a reduced {mapModeRef.current === "reference"
                ? REFERENCE_STYLE_LABELS[referenceStyleRef.current].toLowerCase()
                : MAP_MODE_LABELS[mapModeRef.current].toLowerCase()} view so you can still browse places and share links even when terrain rendering is not available.
            </span>
          </div>
        </div>
        {mapStatus ? (
          <div className="map-status-badge is-error" role="status" aria-live="polite">
            {mapStatus.message}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        data-testid="terrain-map"
        className="map-canvas"
        aria-label="Huntsville terrain map"
        tabIndex={0}
      />
      {mapStatus ? (
        <div
          className={`map-status-badge is-${mapStatus.tone}`}
          role="status"
          aria-live="polite"
        >
          {mapStatus.message}
        </div>
      ) : null}
    </>
  );
}
