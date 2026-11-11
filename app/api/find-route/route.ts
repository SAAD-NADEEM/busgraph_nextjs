/**
 * POST /api/find-route
 *
 * Accepts origin and destination coordinates, runs the multi-option and
 * multi-bus transfer engine, and returns both the ranked options and the top match.
 */

import { NextRequest } from "next/server";
import { findRouteOptions } from "@/lib/routeMatcher";

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
        { status: 400 }
      );
    }

    const options = await findRouteOptions(origin, destination);

    if (!options || options.length === 0) {
      return Response.json(
        { error: "No bus routes or transfer combinations found for these locations." },
        { status: 404 }
      );
    }

    return Response.json({
      options,
      bestMatch: options[0],
    });
  } catch (err) {
    console.error("[find-route] Error:", err);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
