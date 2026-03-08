from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
import sys
from pathlib import Path
from typing import Iterable
from urllib.parse import urlencode
from urllib.request import urlopen

import mercantile
import numpy as np
import rasterio
from contourpy import contour_generator
from PIL import Image
from affine import Affine
from rasterio.enums import Resampling
from rasterio.fill import fillnodata
from rasterio.merge import merge
from rasterio.transform import from_bounds
from rasterio.vrt import WarpedVRT
from rasterio.warp import transform, transform_bounds

BBOX = (-86.72, 34.62, -86.43, 34.83)
WORKING_RESOLUTION_METERS = 4.2
MIN_ZOOM = 8
MAX_ZOOM = 15
TILE_SIZE = 512
CONTOUR_INTERVAL_METERS = 20
CONTOUR_STRIDE = 6
INVALID_ELEVATION_METERS = 0.1
FILL_SEARCH_DISTANCE_PIXELS = 2048

RAW_DIR = Path("data/raw/elevation/usgs-1m")
PROCESSED_DIR = Path("data/processed/terrain")
CLIPPED_DEM_PATH = RAW_DIR / "huntsville-core-4p2m.tif"
COVERAGE_PATH = RAW_DIR / "coverage.json"
CHUNKS_DIR = RAW_DIR / "chunks"
TILES_DIR = Path("public/generated/terrain/tiles")
SOURCE_MANIFEST_PATH = Path("public/generated/terrain/source.json")
CONTOURS_PATH = Path("public/generated/terrain/contours.geojson")

TNM_ENDPOINT = "https://tnmaccess.nationalmap.gov/api/v1/products"
IMAGE_SERVER_EXPORT = (
    "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/"
    "ImageServer/exportImage"
)
TITLE_TILE_PATTERN = re.compile(r"\bx(?P<x>\d+)y(?P<y>\d+)\b", re.IGNORECASE)
MAX_EXPORT_PIXELS = 2000


def parse_tile_key(title: str) -> str | None:
    match = TITLE_TILE_PATTERN.search(title)
    if not match:
        return None
    return f"x{match.group('x')}y{match.group('y')}"


def query_products(bbox: tuple[float, float, float, float]) -> list[dict]:
    query = urlencode(
      {
        "datasets": "Digital Elevation Model (DEM) 1 meter",
        "bbox": ",".join(str(value) for value in bbox),
        "prodFormats": "GeoTIFF",
        "outputFormat": "JSON",
      }
    )
    with urlopen(f"{TNM_ENDPOINT}?{query}") as response:
        data = json.load(response)
    return data["items"]


def select_latest_products(products: Iterable[dict]) -> list[dict]:
    by_tile: dict[str, dict] = {}
    for product in products:
        tile_key = parse_tile_key(product["title"])
        if tile_key is None:
            continue
        current = by_tile.get(tile_key)
        if current is None or product["publicationDate"] > current["publicationDate"]:
            by_tile[tile_key] = {**product, "tileKey": tile_key}
    return [by_tile[key] for key in sorted(by_tile)]


def export_image_chunk(
    output_path: Path,
    bounds_3857: tuple[float, float, float, float],
    size: tuple[int, int],
) -> None:
    params = urlencode(
        {
            "bbox": ",".join(str(value) for value in bounds_3857),
            "bboxSR": 3857,
            "imageSR": 3857,
            "size": f"{size[0]},{size[1]}",
            "format": "tiff",
            "pixelType": "F32",
            "interpolation": "RSP_BilinearInterpolation",
            "f": "pjson",
        }
    )
    export_info = json.loads(
        subprocess.run(
            [
                "curl",
                "-fsSL",
                "--http1.1",
                "--retry",
                "3",
                "--retry-delay",
                "2",
                f"{IMAGE_SERVER_EXPORT}?{params}",
            ],
            check=True,
            capture_output=True,
            text=True,
        ).stdout
    )
    output_path.write_bytes(
        subprocess.run(
            [
                "curl",
                "-fsSL",
                "--http1.1",
                "--retry",
                "3",
                "--retry-delay",
                "2",
                export_info["href"],
            ],
            check=True,
            capture_output=True,
        ).stdout
    )


def export_clipped_dem(output_path: Path, bbox: tuple[float, float, float, float]) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)
    xmin, ymin, xmax, ymax = transform_bounds(
        "EPSG:4326", "EPSG:3857", *bbox, densify_pts=21
    )
    width = math.ceil((xmax - xmin) / WORKING_RESOLUTION_METERS)
    height = math.ceil((ymax - ymin) / WORKING_RESOLUTION_METERS)
    columns = math.ceil(width / MAX_EXPORT_PIXELS)
    rows = math.ceil(height / MAX_EXPORT_PIXELS)

    chunk_paths: list[Path] = []
    for row in range(rows):
        for column in range(columns):
            chunk_pixel_width = min(MAX_EXPORT_PIXELS, width - column * MAX_EXPORT_PIXELS)
            chunk_pixel_height = min(MAX_EXPORT_PIXELS, height - row * MAX_EXPORT_PIXELS)

            chunk_xmin = xmin + column * MAX_EXPORT_PIXELS * WORKING_RESOLUTION_METERS
            chunk_xmax = chunk_xmin + chunk_pixel_width * WORKING_RESOLUTION_METERS
            chunk_ymax = ymax - row * MAX_EXPORT_PIXELS * WORKING_RESOLUTION_METERS
            chunk_ymin = chunk_ymax - chunk_pixel_height * WORKING_RESOLUTION_METERS

            chunk_path = CHUNKS_DIR / f"chunk-r{row}-c{column}.tif"
            export_image_chunk(
                chunk_path,
                (chunk_xmin, chunk_ymin, chunk_xmax, chunk_ymax),
                (chunk_pixel_width, chunk_pixel_height),
            )
            chunk_paths.append(chunk_path)

    sources = [rasterio.open(path) for path in chunk_paths]
    try:
        mosaic, transform = merge(sources, nodata=-32768)
        profile = sources[0].profile.copy()
        profile.update(
            driver="GTiff",
            height=mosaic.shape[1],
            width=mosaic.shape[2],
            transform=transform,
            count=1,
            dtype=str(mosaic.dtype),
            compress="lzw",
            predictor=2,
            tiled=True,
            nodata=-32768,
        )
        with rasterio.open(output_path, "w", **profile) as destination:
            destination.write(mosaic)
    finally:
        for source in sources:
            source.close()


def merge_chunk_exports(chunk_paths: list[Path], output_path: Path) -> None:
    sources = [rasterio.open(path) for path in chunk_paths]
    try:
        mosaic, transform = merge(sources, nodata=-32768)
        mosaic[0] = repair_invalid_elevations(mosaic[0], -32768)
        profile = sources[0].profile.copy()
        profile.update(
            driver="GTiff",
            height=mosaic.shape[1],
            width=mosaic.shape[2],
            transform=transform,
            count=1,
            dtype=str(mosaic.dtype),
            compress="lzw",
            predictor=2,
            tiled=True,
            nodata=-32768,
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with rasterio.open(output_path, "w", **profile) as destination:
            destination.write(mosaic)
    finally:
        for source in sources:
            source.close()


def write_coverage_manifest(products: list[dict]) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "bbox": BBOX,
        "count": len(products),
        "products": [
            {
                "tileKey": product["tileKey"],
                "title": product["title"],
                "publicationDate": product["publicationDate"],
                "downloadURL": product["downloadURL"],
                "filename": Path(product["downloadURL"]).name,
            }
            for product in products
        ],
    }
    COVERAGE_PATH.write_text(f"{json.dumps(payload, indent=2)}\n")


def encode_terrarium(elevations: np.ndarray) -> np.ndarray:
    shifted = np.clip(elevations + 32768.0, 0, 65535.999)
    red = np.floor(shifted / 256.0)
    green = np.floor(shifted % 256.0)
    blue = np.floor((shifted - np.floor(shifted)) * 256.0)
    stacked = np.stack([red, green, blue], axis=-1)
    return stacked.astype(np.uint8)


def tile_lonlat_bounds(src: rasterio.io.DatasetReader) -> tuple[float, float, float, float]:
    return transform_bounds(src.crs, "EPSG:4326", *src.bounds, densify_pts=21)


def repair_invalid_elevations(
    elevations: np.ndarray, nodata: float | None
) -> np.ndarray:
    repaired = elevations.astype(np.float32, copy=True)
    invalid = ~np.isfinite(repaired)
    if nodata is not None:
        invalid |= np.isclose(repaired, nodata)
    invalid |= repaired <= INVALID_ELEVATION_METERS

    if not np.any(invalid):
        return repaired

    repaired[invalid] = 0.0
    filled = fillnodata(
        repaired,
        mask=(~invalid).astype(np.uint8),
        max_search_distance=FILL_SEARCH_DISTANCE_PIXELS,
        smoothing_iterations=0,
    )
    still_invalid = ~np.isfinite(filled) | (filled <= INVALID_ELEVATION_METERS)
    if np.any(still_invalid):
        filled[still_invalid] = INVALID_ELEVATION_METERS

    return filled.astype(np.float32)


def generate_contours(input_raster: Path, output_path: Path) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(input_raster) as src:
        out_height = max(2, src.height // CONTOUR_STRIDE)
        out_width = max(2, src.width // CONTOUR_STRIDE)
        data = src.read(
            1,
            out_shape=(out_height, out_width),
            resampling=Resampling.bilinear,
            masked=True,
        )
        if np.all(data.mask):
            output_path.write_text('{"type":"FeatureCollection","features":[]}\n')
            return 0

        scaled_transform = src.transform * Affine.scale(
            src.width / out_width, src.height / out_height
        )
        xs = scaled_transform.c + scaled_transform.a * (np.arange(out_width) + 0.5)
        ys = scaled_transform.f + scaled_transform.e * (np.arange(out_height) + 0.5)

        filled = repair_invalid_elevations(
            data.filled(src.nodata if src.nodata is not None else np.nan),
            src.nodata,
        )
        finite = np.isfinite(filled)
        min_elevation = float(np.nanmin(filled[finite]))
        max_elevation = float(np.nanmax(filled[finite]))

        start = math.floor(min_elevation / CONTOUR_INTERVAL_METERS) * CONTOUR_INTERVAL_METERS
        stop = math.ceil(max_elevation / CONTOUR_INTERVAL_METERS) * CONTOUR_INTERVAL_METERS

        generator = contour_generator(x=xs, y=ys, z=filled, corner_mask=True)
        features: list[dict] = []

        for elevation in range(int(start), int(stop) + CONTOUR_INTERVAL_METERS, CONTOUR_INTERVAL_METERS):
            lines = generator.lines(float(elevation))
            for line in lines:
                if len(line) < 2:
                    continue
                longitudes, latitudes = transform(
                    src.crs,
                    "EPSG:4326",
                    line[:, 0].tolist(),
                    line[:, 1].tolist(),
                )
                coordinates = [
                    [round(lng, 6), round(lat, 6)]
                    for lng, lat in zip(longitudes, latitudes)
                ]
                features.append(
                    {
                        "type": "Feature",
                        "properties": {"elevation_m": elevation},
                        "geometry": {"type": "LineString", "coordinates": coordinates},
                    }
                )

    output_path.write_text(
        f'{json.dumps({"type": "FeatureCollection", "features": features})}\n'
    )
    return len(features)


def generate_terrain_tiles(input_raster: Path, output_dir: Path) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    with rasterio.open(input_raster) as src:
        west, south, east, north = tile_lonlat_bounds(src)
        for zoom in range(MIN_ZOOM, MAX_ZOOM + 1):
            for tile in mercantile.tiles(west, south, east, north, [zoom]):
                tile_bounds = mercantile.xy_bounds(tile)
                transform = from_bounds(*tile_bounds, TILE_SIZE, TILE_SIZE)
                with WarpedVRT(
                    src,
                    crs="EPSG:3857",
                    transform=transform,
                    width=TILE_SIZE,
                    height=TILE_SIZE,
                    resampling=Resampling.bilinear,
                    nodata=-32768,
                ) as vrt:
                    data = vrt.read(1, masked=True)
                    if np.all(data.mask):
                        continue
                    repaired = repair_invalid_elevations(
                        data.filled(src.nodata if src.nodata is not None else np.nan),
                        src.nodata,
                    )
                    encoded = encode_terrarium(repaired.astype(np.float64))
                    tile_path = output_dir / str(tile.z) / str(tile.x)
                    tile_path.mkdir(parents=True, exist_ok=True)
                    Image.fromarray(encoded, mode="RGB").save(tile_path / f"{tile.y}.png")
                    count += 1
    return count


def write_source_manifest(products: list[dict], tile_count: int) -> None:
    SOURCE_MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    manifest = {
        "generatedAt": json.loads(json.dumps({"timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z"}))["timestamp"],
        "sourceType": "local-usgs-3dep-1m-derived",
        "workingResolutionMeters": WORKING_RESOLUTION_METERS,
        "tileTemplate": "/generated/terrain/tiles/{z}/{x}/{y}.png",
        "contoursPath": "/generated/terrain/contours.geojson",
        "encoding": "terrarium",
        "minZoom": MIN_ZOOM,
        "maxZoom": MAX_ZOOM,
        "bbox": BBOX,
        "tileCount": tile_count,
        "products": [
            {
                "tileKey": product["tileKey"],
                "title": product["title"],
                "publicationDate": product["publicationDate"],
                "downloadURL": product["downloadURL"],
            }
            for product in products
        ],
        "clippedDemPath": str(CLIPPED_DEM_PATH),
    }
    SOURCE_MANIFEST_PATH.write_text(f"{json.dumps(manifest, indent=2)}\n")


def run_download() -> None:
    products = select_latest_products(query_products(BBOX))
    write_coverage_manifest(products)
    export_clipped_dem(CLIPPED_DEM_PATH, BBOX)
    print(f"Selected {len(products)} USGS 1m coverage records and exported {CLIPPED_DEM_PATH}")


def run_build() -> None:
    coverage = json.loads(COVERAGE_PATH.read_text())
    products = coverage["products"]
    chunk_paths = sorted(CHUNKS_DIR.glob("chunk-r*-c*.tif"))
    if not chunk_paths:
        print(f"No clipped DEM chunks found in {CHUNKS_DIR}", file=sys.stderr)
        raise SystemExit(1)
    merge_chunk_exports(chunk_paths, CLIPPED_DEM_PATH)
    contour_count = generate_contours(CLIPPED_DEM_PATH, CONTOURS_PATH)
    tile_count = generate_terrain_tiles(CLIPPED_DEM_PATH, TILES_DIR)
    write_source_manifest(products, tile_count)
    print(
        f"Generated {tile_count} terrain tiles and {contour_count} contour lines from {CLIPPED_DEM_PATH}"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["download", "build"])
    args = parser.parse_args()

    if args.command == "download":
        run_download()
        return 0

    if not COVERAGE_PATH.exists():
        print(f"Coverage manifest missing at {COVERAGE_PATH}", file=sys.stderr)
        return 1

    run_build()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
