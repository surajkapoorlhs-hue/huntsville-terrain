import { useEffect, useState } from "react";
import "./styles.css";
import { MapView } from "./map/MapView";
import { useMapUiStore } from "./store/mapUiStore";
import { LayerControls } from "./ui/LayerControls";
import { SiteInfoCard } from "./ui/SiteInfoCard";

export function getAppTitle(): string {
  return "Huntsville Terrain Explorer";
}

export default function App() {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const hydrateSavedHomes = useMapUiStore((state) => state.hydrateSavedHomes);

  useEffect(() => {
    hydrateSavedHomes();
  }, [hydrateSavedHomes]);

  return (
    <main className="map-stage">
      <div className="map-shell" aria-label="Huntsville terrain map shell">
        <MapView />
        <aside
          className={`control-dock${isDockCollapsed ? " is-collapsed" : ""}`}
        >
          <div className="dock-header">
            <div className="dock-header-copy">
              <p className="eyebrow">Huntsville, Alabama</p>
              <h1>{getAppTitle()}</h1>
              {!isDockCollapsed ? (
                <p className="lede">
                  Explore the ridges, valleys, preserves, mountain fronts, and
                  map modes that shape Huntsville core.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="dock-toggle"
              aria-label={isDockCollapsed ? "Expand controls" : "Collapse controls"}
              onClick={() => {
                setIsDockCollapsed((current) => !current);
              }}
            >
              {isDockCollapsed ? "+" : "-"}
            </button>
          </div>
          {!isDockCollapsed ? <LayerControls /> : null}
        </aside>
      </div>
      <SiteInfoCard />
    </main>
  );
}
