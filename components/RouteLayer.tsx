"use client";
import { Source, Layer } from "react-map-gl/mapbox";

interface RouteLayerProps {
  id?: string;
  coordinates: [number, number][];
  color?: string;
}

export default function RouteLayer({
  id = "route",
  coordinates,
  color = "#1a73e8",
}: RouteLayerProps) {
  if (!coordinates || coordinates.length < 2) return null;

  const startCoord = coordinates[0];
  const endCoord = coordinates[coordinates.length - 1];

  const features: GeoJSON.Feature[] = [
    {
      type: "Feature",
      properties: { kind: "line" },
      geometry: {
        type: "LineString",
        coordinates,
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
    <Source id={`source-${id}`} type="geojson" data={geojson}>
      {/* White casing underneath for high visibility */}
      <Layer
        id={`layer-casing-${id}`}
        type="line"
        filter={["==", ["get", "kind"], "line"]}
        layout={{ "line-join": "round", "line-cap": "round" }}
        paint={{
          "line-color": "#ffffff",
          "line-width": 8,
          "line-opacity": 1,
        }}
      />
      {/* Route line */}
      <Layer
        id={`layer-line-${id}`}
        type="line"
        filter={["==", ["get", "kind"], "line"]}
        layout={{ "line-join": "round", "line-cap": "round" }}
        paint={{
          "line-color": color,
          "line-width": 5,
          "line-opacity": 0.95,
        }}
      />
      {/* Endpoints */}
      <Layer
        id={`layer-endpoints-${id}`}
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
}
