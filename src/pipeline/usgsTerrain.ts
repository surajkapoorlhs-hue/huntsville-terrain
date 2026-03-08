export type UsgsProduct = {
  title: string;
  publicationDate: string;
  downloadURL: string;
};

export type UsgsSelectedProduct = UsgsProduct & {
  tileKey: string;
};

const TILE_KEY_PATTERN = /\bx(?<x>\d+)y(?<y>\d+)\b/i;

export function parseTileKeyFromTitle(title: string) {
  const match = title.match(TILE_KEY_PATTERN);
  if (!match?.groups) {
    return null;
  }

  return `x${match.groups.x}y${match.groups.y}`;
}

export function selectLatestProductsByTileKey(products: UsgsProduct[]) {
  const byTileKey = new Map<string, UsgsSelectedProduct>();

  for (const product of products) {
    const tileKey = parseTileKeyFromTitle(product.title);
    if (!tileKey) {
      continue;
    }

    const existing = byTileKey.get(tileKey);
    if (!existing || product.publicationDate > existing.publicationDate) {
      byTileKey.set(tileKey, {
        ...product,
        tileKey
      });
    }
  }

  return [...byTileKey.values()].sort((left, right) =>
    left.tileKey.localeCompare(right.tileKey)
  );
}

export function encodeTerrariumPixel(elevationMeters: number) {
  const shifted = elevationMeters + 32768;
  const red = Math.floor(shifted / 256);
  const green = Math.floor(shifted % 256);
  const blue = Math.floor((shifted - Math.floor(shifted)) * 256);

  return [red, green, blue] as const;
}
