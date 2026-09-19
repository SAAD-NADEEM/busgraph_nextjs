"use client";
import { Source, Layer } from "react-map-gl/mapbox";

export default function RouteLayer({
  coordinates,
  color = "#1a73e8",
}: {
  coordinates: [number, number][];
  color?: string;
}) {
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
    <Source id="route" type="geojson" data={geojson}>
      {/* White casing underneath */}
      <Layer
        id="route-casing"
        type="line"
        filter={["==", ["get", "kind"], "line"]}
        layout={{ "line-join": "round", "line-cap": "round" }}
        paint={{
          "line-color": "#ffffff",
          "line-width": 10,
          "line-opacity": 1,
        }}
      />
      {/* Colored route line on top */}
      <Layer
        id="route-line"
        type="line"
        filter={["==", ["get", "kind"], "line"]}
        layout={{ "line-join": "round", "line-cap": "round" }}
        paint={{
          "line-color": color,
          "line-width": 6,
          "line-opacity": 1,
        }}
      />
      {/* Terminal circles at each end */}
      <Layer
        id="route-endpoints"
        type="circle"
        filter={["==", ["get", "kind"], "endpoint"]}
        paint={{
          "circle-radius": 7,
          "circle-color": color,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 1,
        }}
      />
    </Source>
  );
}
