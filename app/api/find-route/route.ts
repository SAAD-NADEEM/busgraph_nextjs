/**
 * POST /api/find-route
 *
 * Accepts origin and destination coordinates, runs the KML-based
 * route matching engine, and returns the best bus route match.
 *
 * Request body:
 * {
 *   "origin": { "lat": number, "lng": number },
 *   "destination": { "lat": number, "lng": number }
 * }
 */

import { NextRequest } from "next/server";
import { findBestRoute } from "@/lib/routeMatcher";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { origin, destination } = body;

    // Validate input
    if (
      !origin ||
      !destination ||
      typeof origin.lat !== "number" ||
      typeof origin.lng !== "number" ||
      typeof destination.lat !== "number" ||
      typeof destination.lng !== "number"
    ) {
      return Response.json(
        { error: "Invalid request. Provide origin and destination with lat/lng." },
        { status: 400 },
      );
    }

    const result = await findBestRoute(origin, destination);

    if (!result) {
      return Response.json(
        { error: "No valid bus route found for the given locations." },
        { status: 404 },
      );
    }

    return Response.json(result);
  } catch (err) {
    console.error("[find-route] Error:", err);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
