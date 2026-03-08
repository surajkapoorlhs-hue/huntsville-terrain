import { useState } from "react";
import {
  naturalPlaces,
  practicalPlaces
} from "../data/curatedPlaces";
import { geocodeHomeAddress } from "../data/geocodeHomes";
import {
  MAP_MODE_LABELS,
  MAP_MODES,
  REFERENCE_STYLE_LABELS,
  REFERENCE_STYLES
} from "../map/mapModes";
import { useMapUiStore } from "../store/mapUiStore";

export function LayerControls() {
  const [addressInput, setAddressInput] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isAddingHome, setIsAddingHome] = useState(false);
  const selectedPlaceId = useMapUiStore((state) => state.selectedPlaceId);
  const selectedHomeId = useMapUiStore((state) => state.selectedHomeId);
  const savedHomes = useMapUiStore((state) => state.savedHomes);
  const mapMode = useMapUiStore((state) => state.mapMode);
  const referenceStyle = useMapUiStore((state) => state.referenceStyle);
  const overlays = useMapUiStore((state) => state.overlays);
  const selectPlace = useMapUiStore((state) => state.selectPlace);
  const selectHome = useMapUiStore((state) => state.selectHome);
  const addSavedHome = useMapUiStore((state) => state.addSavedHome);
  const removeSavedHome = useMapUiStore((state) => state.removeSavedHome);
  const setMapMode = useMapUiStore((state) => state.setMapMode);
  const setReferenceStyle = useMapUiStore((state) => state.setReferenceStyle);
  const toggleOverlay = useMapUiStore((state) => state.toggleOverlay);

  async function handleAddHome() {
    setAddressError(null);
    setIsAddingHome(true);

    try {
      const geocodedHome = await geocodeHomeAddress(addressInput);
      addSavedHome({
        ...geocodedHome,
        id:
          globalThis.crypto?.randomUUID?.() ??
          `home-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      });
      setAddressInput("");
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : "Unable to add that address."
      );
    } finally {
      setIsAddingHome(false);
    }
  }

  return (
    <div className="layer-controls">
      <section className="control-block">
        <span>Map mode</span>
        <div className="toggle-row">
          {MAP_MODES.map((mode) => {
            const isActive = mapMode === mode;

            return (
              <button
                key={mode}
                type="button"
                aria-pressed={isActive}
                className={isActive ? "is-active" : undefined}
                onClick={() => {
                  setMapMode(mode);
                }}
              >
                {MAP_MODE_LABELS[mode]}
              </button>
            );
          })}
        </div>
      </section>

      {mapMode === "reference" ? (
        <section className="control-block">
          <span>Reference style</span>
          <div className="toggle-row">
            {REFERENCE_STYLES.map((style) => {
              const isActive = referenceStyle === style;

              return (
                <button
                  key={style}
                  type="button"
                  aria-pressed={isActive}
                  className={isActive ? "is-active" : undefined}
                  onClick={() => {
                    setReferenceStyle(style);
                  }}
                >
                  {REFERENCE_STYLE_LABELS[style]}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="control-block">
        <span>Overlays</span>
        <div className="toggle-row">
          <button
            type="button"
            aria-pressed={overlays.streams}
            className={overlays.streams ? "is-active" : undefined}
            onClick={() => {
              toggleOverlay("streams");
            }}
          >
            Streams
          </button>
          <button
            type="button"
            aria-pressed={overlays.parks}
            className={overlays.parks ? "is-active" : undefined}
            onClick={() => {
              toggleOverlay("parks");
            }}
          >
            Preserves/Parks
          </button>
          <button
            type="button"
            aria-pressed={overlays.sites}
            className={overlays.sites ? "is-active" : undefined}
            onClick={() => {
              toggleOverlay("sites");
            }}
          >
            Curated Sites
          </button>
          <button
            type="button"
            aria-pressed={overlays.trails}
            className={overlays.trails ? "is-active" : undefined}
            onClick={() => {
              toggleOverlay("trails");
            }}
          >
            Trails
          </button>
        </div>
      </section>

      <section className="control-block">
        <span>Natural Sites</span>
        <div className="site-button-list">
          {naturalPlaces.features.map((site) => {
            const isActive = site.properties.id === selectedPlaceId;

            return (
              <button
                key={site.properties.id}
                type="button"
                className={isActive ? "is-active" : undefined}
                onClick={() => {
                  selectPlace(site.properties.id);
                }}
              >
                {site.properties.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="control-block">
        <span>Practical Places</span>
        <div className="site-button-list">
          {practicalPlaces.features.map((place) => {
            const isActive = place.properties.id === selectedPlaceId;

            return (
              <button
                key={place.properties.id}
                type="button"
                className={isActive ? "is-active" : undefined}
                onClick={() => {
                  selectPlace(place.properties.id);
                }}
              >
                {place.properties.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="control-block">
        <span>Homes to Consider</span>
        <div className="home-form">
          <label className="sr-only" htmlFor="candidate-home-address">
            Address to consider
          </label>
          <input
            id="candidate-home-address"
            type="text"
            value={addressInput}
            placeholder="Enter a home address"
            aria-label="Address to consider"
            onChange={(event) => {
              setAddressInput(event.target.value);
              if (addressError) {
                setAddressError(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleAddHome();
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              void handleAddHome();
            }}
            disabled={isAddingHome}
          >
            {isAddingHome ? "Adding…" : "Add home"}
          </button>
        </div>
        {addressError ? (
          <p className="control-help is-error" role="status">
            {addressError}
          </p>
        ) : (
          <p className="control-help">
            Saved in this browser so you can compare candidate homes across sessions.
          </p>
        )}
        <div className="home-list">
          {savedHomes.map((home) => {
            const isActive = home.id === selectedHomeId;

            return (
              <div key={home.id} className="home-list-item">
                <button
                  type="button"
                  className={isActive ? "is-active" : undefined}
                  onClick={() => {
                    selectHome(home.id);
                  }}
                >
                  {home.label}
                </button>
                <button
                  type="button"
                  className="home-remove-button"
                  aria-label={`Remove ${home.label}`}
                  onClick={() => {
                    removeSavedHome(home.id);
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
