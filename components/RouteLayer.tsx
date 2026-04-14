"use client";
import { Source, Layer } from "react-map-gl/mapbox";

export default function RouteLayer({ coordinates }) {
  const geojson = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates,
    },
  };

  return (
    <Source id="route" type="geojson" data={geojson}>
      {/* White casing underneath */}
      <Layer
        id="route-casing"
        type="line"
        layout={{ "line-join": "round", "line-cap": "round" }}
        paint={{
          "line-color": "#ffffff",
          "line-width": 10,
          "line-opacity": 1,
        }}
      />
      {/* Blue line on top */}
      <Layer
        id="route-line"
        type="line"
        layout={{ "line-join": "round", "line-cap": "round" }}
        paint={{
          "line-color": "#1a73e8",
          "line-width": 6,
          "line-opacity": 1,
        }}
      />
    </Source>
  );
}
