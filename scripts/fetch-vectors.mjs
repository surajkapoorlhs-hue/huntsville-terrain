import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rawVectorDirUrl = new URL("../data/raw/vectors/", import.meta.url);
const overpassUrl = "https://overpass-api.de/api/interpreter";
const bbox = "34.62,-86.72,34.83,-86.43";

const queries = {
  streams: `
[out:json][timeout:120];
(
  way["waterway"~"stream|river|ditch|drain"](${bbox});
  relation["waterway"~"stream|river|ditch|drain"](${bbox});
);
out body geom;
`,
  parks: `
[out:json][timeout:120];
(
  way["leisure"="park"](${bbox});
  relation["leisure"="park"](${bbox});
  way["boundary"="protected_area"](${bbox});
  relation["boundary"="protected_area"](${bbox});
  way["leisure"="nature_reserve"](${bbox});
  relation["leisure"="nature_reserve"](${bbox});
);
out body geom;
`,
  trails: `
[out:json][timeout:120];
(
  way["highway"~"path|track|bridleway"](${bbox});
  way["highway"="footway"]["footway"!="sidewalk"]["name"](${bbox});
  way["sac_scale"](${bbox});
  relation["route"="hiking"](${bbox});
);
out body geom;
`
};

async function runOverpassQuery(kind, query) {
  const destination = new URL(`./${kind}.overpass.json`, rawVectorDirUrl);
  await execFileAsync("curl", [
    "-fsSL",
    "--http1.1",
    "--retry",
    "3",
    "--retry-delay",
    "2",
    "-X",
    "POST",
    overpassUrl,
    "--data-raw",
    query,
    "-o",
    fileURLToPath(destination)
  ]);
}

export async function ensureVectorWorkspace() {
  await mkdir(rawVectorDirUrl, { recursive: true });

  for (const [kind, query] of Object.entries(queries)) {
    await runOverpassQuery(kind, query);
  }

  return {
    rawDirectory: fileURLToPath(rawVectorDirUrl)
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await ensureVectorWorkspace();
  console.log(`Fetched overlay source files into ${result.rawDirectory}`);
}
