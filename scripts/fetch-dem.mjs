import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const BBOX = [-86.72, 34.62, -86.43, 34.83];
const WORKING_RESOLUTION_METERS = 4.2;
const MAX_EXPORT_PIXELS = 1000;
const RAW_DIR = new URL("../data/raw/elevation/usgs-1m/", import.meta.url);
const CHUNKS_DIR = new URL("./chunks/", RAW_DIR);
const COVERAGE_URL = new URL("./coverage.json", RAW_DIR);
const execFileAsync = promisify(execFile);
const RETRY_ATTEMPTS = 20;

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function lonLatToWebMercator([lng, lat]) {
  const radius = 6378137;
  const x = radius * ((lng * Math.PI) / 180);
  const y =
    radius *
    Math.log(Math.tan(Math.PI / 4 + (Math.min(Math.max(lat, -85), 85) * Math.PI) / 360));
  return [x, y];
}

function parseTileKeyFromTitle(title) {
  const match = title.match(/\bx(\d+)y(\d+)\b/i);
  return match ? `x${match[1]}y${match[2]}` : null;
}

function selectLatestProducts(products) {
  const byTileKey = new Map();
  for (const product of products) {
    const tileKey = parseTileKeyFromTitle(product.title);
    if (!tileKey) {
      continue;
    }

    const current = byTileKey.get(tileKey);
    if (!current || product.publicationDate > current.publicationDate) {
      byTileKey.set(tileKey, { ...product, tileKey });
    }
  }

  return [...byTileKey.values()].sort((left, right) =>
    left.tileKey.localeCompare(right.tileKey)
  );
}

async function curlJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const { stdout } = await execFileAsync("curl", ["-fsSL", "--http1.1", url]);
      return JSON.parse(stdout);
    } catch (error) {
      lastError = error;
      await sleep(750 * attempt);
    }
  }
  throw lastError;
}

async function curlToFile(url, destinationPath) {
  let lastError;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      await execFileAsync("curl", [
        "-fsSL",
        "--http1.1",
        "-o",
        destinationPath,
        url
      ]);
      return;
    } catch (error) {
      lastError = error;
      await sleep(750 * attempt);
    }
  }
  throw lastError;
}

async function downloadChunkedDem() {
  const tnmParams = new URLSearchParams({
    datasets: "Digital Elevation Model (DEM) 1 meter",
    bbox: BBOX.join(","),
    prodFormats: "GeoTIFF",
    outputFormat: "JSON"
  });
  const coverage = await curlJson(
    `https://tnmaccess.nationalmap.gov/api/v1/products?${tnmParams}`
  );
  const selectedProducts = selectLatestProducts(coverage.items);

  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(CHUNKS_DIR, { recursive: true });

  const [xmin, ymin] = lonLatToWebMercator([BBOX[0], BBOX[1]]);
  const [xmax, ymax] = lonLatToWebMercator([BBOX[2], BBOX[3]]);

  const width = Math.ceil((xmax - xmin) / WORKING_RESOLUTION_METERS);
  const height = Math.ceil((ymax - ymin) / WORKING_RESOLUTION_METERS);
  const columns = Math.ceil(width / MAX_EXPORT_PIXELS);
  const rows = Math.ceil(height / MAX_EXPORT_PIXELS);

  const chunks = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const chunkPixelWidth = Math.min(
        MAX_EXPORT_PIXELS,
        width - column * MAX_EXPORT_PIXELS
      );
      const chunkPixelHeight = Math.min(
        MAX_EXPORT_PIXELS,
        height - row * MAX_EXPORT_PIXELS
      );

      const chunkXmin = xmin + column * MAX_EXPORT_PIXELS * WORKING_RESOLUTION_METERS;
      const chunkXmax = chunkXmin + chunkPixelWidth * WORKING_RESOLUTION_METERS;
      const chunkYmax = ymax - row * MAX_EXPORT_PIXELS * WORKING_RESOLUTION_METERS;
      const chunkYmin = chunkYmax - chunkPixelHeight * WORKING_RESOLUTION_METERS;

      const exportParams = new URLSearchParams({
        bbox: [chunkXmin, chunkYmin, chunkXmax, chunkYmax].join(","),
        bboxSR: "3857",
        imageSR: "3857",
        size: `${chunkPixelWidth},${chunkPixelHeight}`,
        format: "tiff",
        pixelType: "F32",
        interpolation: "RSP_BilinearInterpolation",
        f: "pjson"
      });

      const exportInfo = await curlJson(
        `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?${exportParams}`
      );

      const filename = `chunk-r${row}-c${column}.tif`;
      const fileUrl = new URL(filename, CHUNKS_DIR);
      await curlToFile(exportInfo.href, fileURLToPath(fileUrl));

      chunks.push({
        row,
        column,
        filename,
        href: exportInfo.href,
        width: chunkPixelWidth,
        height: chunkPixelHeight
      });
    }
  }

  await writeFile(
    COVERAGE_URL,
    `${JSON.stringify(
      {
        bbox: BBOX,
        workingResolutionMeters: WORKING_RESOLUTION_METERS,
        count: selectedProducts.length,
        products: selectedProducts.map((product) => ({
          tileKey: product.tileKey,
          title: product.title,
          publicationDate: product.publicationDate,
          downloadURL: product.downloadURL,
          filename: product.downloadURL.split("/").pop()
        })),
        chunks
      },
      null,
      2
    )}\n`
  );

  return {
    selectedCount: selectedProducts.length,
    chunkCount: chunks.length
  };
}

export async function ensureDemWorkspace() {
  return downloadChunkedDem();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await ensureDemWorkspace();
  console.log(
    `Selected ${result.selectedCount} USGS 1m coverage records and downloaded ${result.chunkCount} clipped DEM chunks`
  );
}
