/**
 * KML parser for bus route data.
 *
 * Reads .kml files from the project's data/ directory, extracts
 * LineString coordinates and route metadata, and caches them
 * in-memory for the server lifecycle.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LatLng } from "./haversine";

export interface ParsedRoute {
  /** Route identifier, e.g. "R3" */
  routeId: string;
  /** Direction identifier, e.g. "R3_UP" */
  direction: string;
  /** Human-readable name, e.g. "R3 (Power House Chowrangi to Nasir Jump)" */
  name: string;
  /** Ordered array of coordinates representing the route polyline */
  coordinates: LatLng[];
}

// ── In-memory cache ──────────────────────────────────────────────
let cachedRoutes: ParsedRoute[] | null = null;

/**
 * Parse a single KML string into a ParsedRoute.
 *
 * Uses simple regex extraction — safe because the KML structure
 * from Google My Maps is consistent and predictable.
 */
export function parseKml(kmlContent: string, filename: string): ParsedRoute {
  // Extract <Placemark><name>
  const nameMatch = kmlContent.match(
    /<Placemark>\s*<name>([\s\S]*?)<\/name>/,
  );
  const name = nameMatch?.[1]?.trim() ?? filename;

  // Extract <Data name="Route"><value>
  const routeIdMatch = kmlContent.match(
    /<Data name="Route">\s*<value>([\s\S]*?)<\/value>/,
  );
  const routeId = routeIdMatch?.[1]?.trim() || filename.replace(".kml", "");

  // Extract <Data name="Direction"><value>
  const directionMatch = kmlContent.match(
    /<Data name="Direction">\s*<value>([\s\S]*?)<\/value>/,
  );
  const direction = directionMatch?.[1]?.trim() || `${routeId}_UP`;

  // Extract <coordinates> block
  const coordsMatch = kmlContent.match(
    /<coordinates>\s*([\s\S]*?)\s*<\/coordinates>/,
  );
  if (!coordsMatch?.[1]) {
    throw new Error(`No <coordinates> found in ${filename}`);
  }

  // Parse "lng,lat,alt" triplets into { lat, lng } objects
  const coordinates: LatLng[] = coordsMatch[1]
    .trim()
    .split(/\s+/)
    .filter((line) => line.length > 0)
    .map((triplet) => {
      const [lngStr, latStr] = triplet.split(",");
      return {
        lat: parseFloat(latStr),
        lng: parseFloat(lngStr),
      };
    });

  return { routeId, direction, name, coordinates };
}

/**
 * Load and parse all .kml files from the data/ directory.
 *
 * Results are cached in-memory — subsequent calls return
 * the same array without re-reading the filesystem.
 */
export async function loadAllRoutes(): Promise<ParsedRoute[]> {
  if (cachedRoutes) return cachedRoutes;

  const dataDir = join(process.cwd(), "data");
  const files = await readdir(dataDir);
  const kmlFiles = files.filter((f) => f.endsWith(".kml"));

  const routes: ParsedRoute[] = [];

  for (const file of kmlFiles) {
    try {
      const content = await readFile(join(dataDir, file), "utf-8");
      routes.push(parseKml(content, file));
    } catch (err) {
      console.warn(`[kmlParser] Skipping ${file} due to parse error:`, err);
    }
  }

  cachedRoutes = routes;
  return routes;
}
