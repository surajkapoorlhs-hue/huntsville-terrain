export type GeocodedHome = {
  label: string;
  address: string;
  coordinates: [number, number];
};

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

function deriveLabel(address: string, displayName?: string) {
  const preferred = displayName?.split(",")[0]?.trim();
  if (preferred) {
    return preferred;
  }

  return address.split(",")[0]?.trim() || address.trim();
}

export async function geocodeHomeAddress(address: string): Promise<GeocodedHome> {
  const normalizedAddress = address.trim();
  if (!normalizedAddress) {
    throw new Error("Enter an address to add a home.");
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", normalizedAddress);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Address lookup failed. Try again in a moment.");
  }

  const matches = (await response.json()) as NominatimResult[];
  const match = matches[0];
  const latitude = match?.lat ? Number(match.lat) : Number.NaN;
  const longitude = match?.lon ? Number(match.lon) : Number.NaN;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("No match found for that address.");
  }

  return {
    label: deriveLabel(normalizedAddress, match.display_name),
    address: normalizedAddress,
    coordinates: [longitude, latitude]
  };
}
