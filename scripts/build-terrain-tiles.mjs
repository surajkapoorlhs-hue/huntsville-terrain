import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const pythonPath = new URL("../.terrain-venv/bin/python", import.meta.url);
const scriptPath = new URL("./usgs_terrain.py", import.meta.url);

export async function buildTerrainArtifacts() {
  const { stdout } = await execFileAsync(fileURLToPath(pythonPath), [
    fileURLToPath(scriptPath),
    "build"
  ]);

  const outputPath = fileURLToPath(
    new URL("../public/generated/terrain/source.json", import.meta.url)
  );

  return {
    outputPath,
    stdout: stdout.trim()
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildTerrainArtifacts();
  console.log(result.stdout || `Wrote terrain source manifest to ${result.outputPath}`);
}
