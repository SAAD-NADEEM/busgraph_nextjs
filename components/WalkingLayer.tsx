"use client";
import { Source, Layer } from "react-map-gl/mapbox";

interface WalkingLayerProps {
  /** Unique ID suffix to avoid Mapbox source/layer collisions */
  id: string;
  /**
   * Ordered [lng, lat] coordinates of the walking path.
   * Obtained from the Mapbox Directions walking API.
   * Falls back gracefully to a two-point straight line if only
   * start/end coords are supplied.
   */
  coordinates: [number, number][];
}

/**
 * Renders a dashed polyline representing a pedestrian walking segment.
 * Coordinates should come from the Mapbox Directions API (walking profile)
 * so the line follows actual roads and footpaths.
 */
export default function WalkingLayer({ id, coordinates }: WalkingLayerProps) {
  if (coordinates.length < 2) return null;

  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates,
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
