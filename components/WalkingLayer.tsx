"use client";
import { Source, Layer } from "react-map-gl/mapbox";

interface WalkingLayerProps {
  /** Unique ID suffix to avoid Mapbox source/layer collisions */
  id: string;
  /** Start point of the walking segment */
  from: { lat: number; lng: number };
  /** End point of the walking segment */
  to: { lat: number; lng: number };
}

/**
 * Renders a dashed polyline between two points to represent
 * a pedestrian walking segment on the map.
 */
export default function WalkingLayer({ id, from, to }: WalkingLayerProps) {
  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
    },
  };

  return (
    <Source id={`walking-${id}`} type="geojson" data={geojson}>
      <Layer
        id={`walking-line-${id}`}
        type="line"
        layout={{ "line-join": "round", "line-cap": "round" }}
        paint={{
          "line-color": "#6B7280",
          "line-width": 4,
          "line-dasharray": [2, 2],
          "line-opacity": 0.8,
        }}
      />
    </Source>
  );
}
