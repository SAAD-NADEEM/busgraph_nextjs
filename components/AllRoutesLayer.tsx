"use client";
import { Source, Layer } from "react-map-gl/mapbox";

/**
 * Distinct, visually separated color palette for bus routes.
 * Cycles if there are more routes than colors.
 */
const ROUTE_COLORS = [
  "#E53935", // red
  "#1E88E5", // blue
  "#43A047", // green
  "#FB8C00", // orange
  "#8E24AA", // purple
  "#00ACC1", // teal
  "#D81B60", // pink
  "#6D4C41", // brown
  "#3949AB", // indigo
  "#C0CA33", // lime
];

export interface RouteData {
  routeId: string;
  name: string;
  direction: string;
  coordinates: [number, number][];
}

interface AllRoutesLayerProps {
  routes: RouteData[];
}

/**
 * Renders all bus route polylines on the map, each with a distinct color.
 */
export default function AllRoutesLayer({ routes }: AllRoutesLayerProps) {
  return (
    <>
      {routes.map((route, i) => {
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: route.coordinates,
          },
        };

        return (
          <Source
            key={`${route.routeId}-${i}`}
            id={`all-route-${route.routeId}-${i}`}
            type="geojson"
            data={geojson}
          >
            {/* White casing for contrast */}
            <Layer
              id={`all-route-casing-${route.routeId}-${i}`}
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": "#ffffff",
                "line-width": 7,
                "line-opacity": 0.6,
              }}
            />
            {/* Colored route line */}
            <Layer
              id={`all-route-line-${route.routeId}-${i}`}
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": color,
                "line-width": 4,
                "line-opacity": 0.85,
              }}
            />
          </Source>
        );
      })}
    </>
  );
}
