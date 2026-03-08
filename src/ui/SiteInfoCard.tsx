import { curatedPlaceById } from "../data/curatedPlaces";
import { useMapUiStore } from "../store/mapUiStore";

export function SiteInfoCard() {
  const selectedPlaceId = useMapUiStore((state) => state.selectedPlaceId);
  const selectedHomeId = useMapUiStore((state) => state.selectedHomeId);
  const savedHomes = useMapUiStore((state) => state.savedHomes);
  const clearSelection = useMapUiStore((state) => state.clearSelection);

  const place = selectedPlaceId ? curatedPlaceById.get(selectedPlaceId) : null;
  const home = selectedHomeId
    ? savedHomes.find((savedHome) => savedHome.id === selectedHomeId) ?? null
    : null;

  if (!place && !home) {
    return null;
  }

  return (
    <section className="site-info-card" aria-live="polite">
      <p className="site-info-eyebrow">
        {place ? place.properties.category : "candidate home"}
      </p>
      <div className="site-info-header">
        <h2>{place ? place.properties.name : home?.label}</h2>
        <button type="button" onClick={clearSelection}>
          Close
        </button>
      </div>
      <p>{place ? place.properties.description : home?.address}</p>
      {place?.properties.address ? (
        <p className="site-info-secondary">{place.properties.address}</p>
      ) : null}
    </section>
  );
}
