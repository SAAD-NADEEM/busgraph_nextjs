/**
 * Route matching engine.
 *
 * Evaluates all loaded KML routes against a user's origin and
 * destination, performing polyline snapping and direction validation
 * to find the best single-bus route.
 */

import type { LatLng, SnapResult } from "./haversine";
import { snapToRoute } from "./haversine";
import { loadAllRoutes } from "./kmlParser";

export interface RouteMatch {
  /** Route identifier, e.g. "R3" */
  routeId: string;
  /** Human-readable name */
  routeName: string;
  /** Direction identifier */
  direction: string;
  /** Snapped boarding point */
  startNode: SnapResult;
  /** Snapped alighting point */
  endNode: SnapResult;
  /**
   * Slice of route coordinates from startNode to endNode (inclusive).
   * In [lng, lat] format for direct use with Mapbox/GeoJSON.
   */
  busPath: [number, number][];
  /** Walking segment: user's origin → snapped boarding point */
  walkToStart: { from: LatLng; to: LatLng };
  /** Walking segment: snapped alighting point → user's destination */
  walkFromEnd: { from: LatLng; to: LatLng };
  /** Combined snap distance in meters (origin→start + destination→end) */
  totalSnapDistance: number;
}

/** Maximum snap distance in meters — routes further than this are rejected */
const MAX_SNAP_DISTANCE_M = 2_000;

/**
 * Find the best bus route for the given origin and destination.
 *
 * Logic:
 * 1. For each loaded route, snap origin → startNode and destination → endNode.
 * 2. Validate direction: endNode.index must be > startNode.index.
 * 3. Reject routes where either snap distance exceeds MAX_SNAP_DISTANCE_M.
 * 4. Return the route with the lowest total snap distance.
 *
 * @returns The best matching route, or null if no valid route exists.
 */
export async function findBestRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<RouteMatch | null> {
  const allRoutes = await loadAllRoutes();
  const candidates: RouteMatch[] = [];

  for (const route of allRoutes) {
    const startNode = snapToRoute(origin, route.coordinates);
    const endNode = snapToRoute(destination, route.coordinates);

    // Direction validation: bus must travel forward in the coordinate array
    if (endNode.index <= startNode.index) continue;

    // Reject if either snap point is too far from the route
    if (
      startNode.distance > MAX_SNAP_DISTANCE_M ||
      endNode.distance > MAX_SNAP_DISTANCE_M
    ) {
      continue;
    }

    // Extract the bus path segment (inclusive), converting to [lng, lat] for Mapbox
    const busPath: [number, number][] = route.coordinates
      .slice(startNode.index, endNode.index + 1)
      .map((coord) => [coord.lng, coord.lat]);

    candidates.push({
      routeId: route.routeId,
      routeName: route.name,
      direction: route.direction,
      startNode,
      endNode,
      busPath,
      walkToStart: { from: origin, to: startNode.point },
      walkFromEnd: { from: endNode.point, to: destination },
      totalSnapDistance: startNode.distance + endNode.distance,
    });
  }

  if (candidates.length === 0) return null;

  // Return the candidate with the lowest total snap distance
  candidates.sort((a, b) => a.totalSnapDistance - b.totalSnapDistance);
  return candidates[0];
}
