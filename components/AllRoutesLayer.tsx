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
        const startCoord = route.coordinates[0];
        const endCoord = route.coordinates[route.coordinates.length - 1];

        const features: GeoJSON.Feature[] = [
          {
            type: "Feature",
            properties: { kind: "line" },
            geometry: {
              type: "LineString",
              coordinates: route.coordinates,
            },
          },
        ];

        if (startCoord) {
          features.push({
            type: "Feature",
            properties: { kind: "endpoint" },
            geometry: {
              type: "Point",
              coordinates: startCoord,
            },
          });
        }

        if (
          endCoord &&
          (endCoord[0] !== startCoord?.[0] || endCoord[1] !== startCoord?.[1])
        ) {
          features.push({
            type: "Feature",
            properties: { kind: "endpoint" },
            geometry: {
              type: "Point",
              coordinates: endCoord,
            },
          });
        }

        const geojson: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features,
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
              filter={["==", ["get", "kind"], "line"]}
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
              filter={["==", ["get", "kind"], "line"]}
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": color,
                "line-width": 4,
                "line-opacity": 0.85,
              }}
            />
            {/* Terminal circle at each end of the route */}
            <Layer
              id={`all-route-endpoints-${route.routeId}-${i}`}
              type="circle"
              filter={["==", ["get", "kind"], "endpoint"]}
              paint={{
                "circle-radius": 6,
                "circle-color": color,
                "circle-stroke-width": 2.5,
                "circle-stroke-color": "#ffffff",
                "circle-opacity": 1,
              }}
            />
          </Source>
        );
      })}
    </>
  );
}
