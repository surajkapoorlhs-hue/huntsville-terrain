import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  encodeTerrariumPixel,
  parseTileKeyFromTitle,
  selectLatestProductsByTileKey
} from "../../src/pipeline/usgsTerrain";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const terrainPython = fileURLToPath(
  new URL("../../.terrain-venv/bin/python", import.meta.url)
);
const historicallyAffectedTiles = [
  "public/generated/terrain/tiles/10/265/406.png",
  "public/generated/terrain/tiles/10/266/406.png",
  "public/generated/terrain/tiles/11/530/812.png",
  "public/generated/terrain/tiles/11/530/813.png",
  "public/generated/terrain/tiles/11/532/812.png",
  "public/generated/terrain/tiles/11/532/813.png"
];

describe("usgs terrain helpers", () => {
  it("parses x/y tile keys from USGS product titles", () => {
    expect(
      parseTileKeyFromTitle("USGS 1 Meter 16 x53y385 AL_NorthAL_2019_B19")
    ).toBe("x53y385");
  });

  it("keeps the latest product per tile key when API results overlap", () => {
    const selected = selectLatestProductsByTileKey([
      {
        title: "USGS 1 Meter 16 x55y385 AL_NorthAL_2019_B19",
        publicationDate: "2021-06-11",
        downloadURL: "old"
      },
      {
        title: "USGS 1 Meter 16 x55y385 AL_17County_2020_B20",
        publicationDate: "2022-07-28",
        downloadURL: "new"
      },
      {
        title: "USGS 1 Meter 16 x54y385 AL_NorthAL_2019_B19",
        publicationDate: "2021-06-11",
        downloadURL: "neighbor"
      }
    ]);

    expect(selected).toHaveLength(2);
    expect(selected.find((item) => item.tileKey === "x55y385")?.downloadURL).toBe(
      "new"
    );
  });

  it("encodes a Terrarium pixel for a known elevation", () => {
    expect(encodeTerrariumPixel(1234.5)).toEqual([132, 210, 128]);
  });

  it("does not ship generated terrain tiles with abyss pixels", () => {
    const output = execFileSync(
      terrainPython,
      [
        "-c",
        [
          "import json",
          "from pathlib import Path",
          "from PIL import Image",
          `tiles = ${JSON.stringify(historicallyAffectedTiles)}`,
          "files_with_black = 0",
          "black_pixels = 0",
          "for tile in tiles:",
          "    path = Path(tile)",
          "    image = Image.open(path)",
          "    pixels = image.load()",
          "    width, height = image.size",
          "    count = sum(1 for y in range(height) for x in range(width) if pixels[x, y] == (0, 0, 0))",
          "    if count:",
          "        files_with_black += 1",
          "        black_pixels += count",
          "print(json.dumps({'filesWithBlack': files_with_black, 'blackPixels': black_pixels}))"
        ].join("\n")
      ],
      {
        cwd: projectRoot,
        encoding: "utf8"
      }
    );

    const stats = JSON.parse(output) as {
      filesWithBlack: number;
      blackPixels: number;
    };

    expect(stats.filesWithBlack).toBe(0);
    expect(stats.blackPixels).toBe(0);
  });
});
