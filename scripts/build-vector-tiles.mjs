import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const rawDirUrl = new URL("../data/raw/vectors/", import.meta.url);
const outputDirUrl = new URL("../public/generated/overlays/", import.meta.url);
const manifestUrl = new URL("./source.json", outputDirUrl);

function toLineFeature(element, properties) {
  const coordinates =
    element.geometry?.map((point) => [point.lon, point.lat]) ?? [];
  if (coordinates.length < 2) {
    return null;
  }

  return {
    type: "Feature",
    properties,
    geometry: {
      type: "LineString",
      coordinates
    }
  };
}

function toPolygonFeature(element, properties) {
  const coordinates =
    element.geometry?.map((point) => [point.lon, point.lat]) ?? [];
  if (coordinates.length < 4) {
    return null;
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coordinates.push(first);
  }

  return {
    type: "Feature",
    properties,
    geometry: {
      type: "Polygon",
      coordinates: [coordinates]
    }
  };
}

function overpassToGeoJson(raw, kind) {
  const features = [];
  for (const element of raw.elements ?? []) {
    const tags = element.tags ?? {};
    const name = tags.name ?? null;
    const properties = { kind, name, osm_id: element.id };

    if (kind === "parks") {
      const feature = toPolygonFeature(element, properties);
      if (feature) {
        features.push(feature);
      }
      continue;
    }

    const feature = toLineFeature(element, properties);
    if (feature) {
      features.push(feature);
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
}

async function readRaw(kind) {
  const fileUrl = new URL(`./${kind}.overpass.json`, rawDirUrl);
  try {
    return JSON.parse(await readFile(fileUrl, "utf8"));
  } catch {
    return { elements: [] };
  }
}

export async function buildVectorArtifacts() {
  await mkdir(outputDirUrl, { recursive: true });

  const outputs = {};

  for (const kind of ["streams", "parks", "trails"]) {
    const raw = await readRaw(kind);
    const collection = overpassToGeoJson(raw, kind);
    const outputUrl = new URL(`./${kind}.geojson`, outputDirUrl);
    await writeFile(outputUrl, `${JSON.stringify(collection)}\n`);
    outputs[kind] = {
      outputPath: fileURLToPath(outputUrl),
      count: collection.features.length
    };
  }

  await writeFile(
    manifestUrl,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        overlays: outputs
      },
      null,
      2
    )}\n`
  );

  return {
    outputPath: fileURLToPath(manifestUrl)
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildVectorArtifacts();
  console.log(`Wrote overlay manifest to ${result.outputPath}`);
}
