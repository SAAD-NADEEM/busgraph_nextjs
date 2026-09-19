/**
 * GET /api/all-routes
 *
 * Returns all parsed bus routes with their coordinates and metadata.
 * Used by the "Show all routes" toggle on the frontend.
 */

import { loadAllRoutes } from "@/lib/kmlParser";

export async function GET() {
  try {
    const routes = await loadAllRoutes();

    const result = routes.map((route) => ({
      routeId: route.routeId,
      name: route.name,
      direction: route.direction,
      coordinates: route.coordinates.map((c) => [c.lng, c.lat] as [number, number]),
    }));

    return Response.json(result);
  } catch (err) {
    console.error("[all-routes] Error:", err);
    return Response.json({ error: "Failed to load routes." }, { status: 500 });
  }
}
