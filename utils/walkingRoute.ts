/**
 * Fetches a walking route between two points using the Mapbox Directions API.
 * Returns coordinates along streets, road-network distance (in meters),
 * and estimated walking duration (in seconds).
 */

function haversineDistM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface WalkingRouteResult {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
}

export async function getWalkingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mapboxToken: string,
): Promise<WalkingRouteResult> {
  const straightDist = haversineDistM(from.lat, from.lng, to.lat, to.lng);
  const fallbackDuration = Math.round(straightDist / 1.33); // ~4.8 km/h

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?geometries=geojson&overview=full&steps=false` +
    `&access_token=${mapboxToken}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox Directions HTTP ${res.status}`);

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) throw new Error("No walking route returned");

    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distance: typeof route.distance === "number" ? route.distance : straightDist,
      duration: typeof route.duration === "number" ? route.duration : fallbackDuration,
    };
  } catch (err) {
    console.warn("[walkingRoute] Falling back to straight line:", err);
    // Straight-line fallback so the app never fully breaks
    return {
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
      distance: straightDist,
      duration: fallbackDuration,
    };
  }
}
