import { buildNaturalSites } from "./build-natural-sites.mjs";
import { buildTerrainArtifacts } from "./build-terrain-tiles.mjs";
import { buildVectorArtifacts } from "./build-vector-tiles.mjs";

const [terrain, vectors, sites] = await Promise.all([
  buildTerrainArtifacts(),
  buildVectorArtifacts(),
  buildNaturalSites()
]);

console.log(
  [
    `terrain=${terrain.outputPath}`,
    `vectors=${vectors.outputPath}`,
    `sites=${sites.outputPath}`,
    `siteCount=${sites.count}`
  ].join("\n")
);
