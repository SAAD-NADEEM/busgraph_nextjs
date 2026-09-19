/**
 * Official bus route colors from People's Bus Service (PBS) / Google My Maps.
 * Matches the exact color palette used in the official route map.
 */
export const ROUTE_COLORS: Record<string, string> = {
  EV1: "#FFEA00", // Yellow
  EV2: "#AFB42B", // Olive / Khaki Green
  EV3: "#4E342E", // Dark Brown
  EV4: "#FF5252", // Coral / Light Red
  EV5: "#795548", // Medium Brown
  R1: "#F9A825",  // Golden Amber / Orange
  R2: "#F57C00",  // Deep Orange
  R3: "#1A237E",  // Dark Navy Blue
  R4: "#0288D1",  // Cerulean / Light Blue
  R8: "#FBC02D",  // Yellow / Amber
  R9: "#A52714",  // Dark Red / Maroon
  R10: "#01579B", // Dark Blue
  R11: "#9C27B0", // Purple
  R12: "#558B2F", // Forest Green
  R13: "#0F9D58", // Teal / Emerald Green
};

export const DEFAULT_ROUTE_COLOR = "#1a73e8";

/**
 * Returns the official company color for a bus route, e.g. "R1", "EV2", "R2_UP".
 */
export function getRouteColor(routeId?: string): string {
  if (!routeId) return DEFAULT_ROUTE_COLOR;
  const cleanId = routeId.trim().toUpperCase().split("_")[0];
  return (
    ROUTE_COLORS[cleanId] ||
    ROUTE_COLORS[routeId.trim().toUpperCase()] ||
    DEFAULT_ROUTE_COLOR
  );
}
