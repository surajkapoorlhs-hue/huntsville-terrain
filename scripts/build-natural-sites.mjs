import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const inputUrl = new URL("../data/natural-sites/huntsville-natural-sites.yaml", import.meta.url);
const outputDirUrl = new URL("../public/generated/sites/", import.meta.url);
const outputUrl = new URL("./huntsville-natural-sites.geojson", outputDirUrl);

export function buildNaturalSitesFeatureCollection(entries) {
  return {
    type: "FeatureCollection",
    features: entries.map((entry) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: entry.coordinates
      },
      properties: {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        description: entry.description ?? ""
      }
    }))
  };
}

export async function buildNaturalSites() {
  const yamlText = await readFile(inputUrl, "utf8");
  const entries = parse(yamlText);
  const featureCollection = buildNaturalSitesFeatureCollection(entries);

  await mkdir(outputDirUrl, { recursive: true });
  await writeFile(outputUrl, `${JSON.stringify(featureCollection, null, 2)}\n`);

  return {
    count: featureCollection.features.length,
    outputPath: fileURLToPath(outputUrl)
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildNaturalSites();
  console.log(
    `Wrote ${result.count} natural sites to ${result.outputPath}`
  );
}
