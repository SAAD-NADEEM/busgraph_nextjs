/**
 * Haversine distance calculation and polyline snapping utilities.
 *
 * Used to find the nearest point on a bus route coordinate array
 * to a given user location, without any external dependencies.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SnapResult {
  /** The closest coordinate on the route */
  point: LatLng;
  /** The index of that coordinate in the route array */
  index: number;
  /** Distance from the user's location to the snapped point, in meters */
  distance: number;
}

const EARTH_RADIUS_M = 6_371_000;

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 *
 * @returns Distance in meters.
 */
export function haversineDistance(p1: LatLng, p2: LatLng): number {
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Snap a user location to the nearest coordinate in a route array.
 *
 * Iterates every coordinate and returns the one with the smallest
 * Haversine distance to `userLocation`.
 */
export function snapToRoute(userLocation: LatLng, routeCoords: LatLng[]): SnapResult {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let i = 0; i < routeCoords.length; i++) {
    const d = haversineDistance(userLocation, routeCoords[i]);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }

  return {
    point: routeCoords[bestIndex],
    index: bestIndex,
    distance: bestDistance,
  };
}
