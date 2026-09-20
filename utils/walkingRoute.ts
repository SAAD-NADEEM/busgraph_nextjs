/**
 * Fetches a walking route between two points using the Mapbox Directions API.
 *
 * @returns Ordered [lng, lat] coordinate array following roads/paths, or
 *          a simple two-point fallback straight line if the API fails.
 */
export async function getWalkingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mapboxToken: string,
): Promise<[number, number][]> {
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

    return route.geometry.coordinates as [number, number][];
  } catch (err) {
    console.warn("[walkingRoute] Falling back to straight line:", err);
    // Straight-line fallback so the app never fully breaks
    return [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ];
  }
}
