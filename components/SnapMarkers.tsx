"use client";
import { Marker } from "react-map-gl/mapbox";

interface SnapMarkersProps {
  /** User's origin location */
  origin: { lat: number; lng: number };
  /** User's destination location */
  destination: { lat: number; lng: number };
  /** Snapped boarding point on the bus route */
  boardingPoint: { lat: number; lng: number };
  /** Snapped alighting point on the bus route */
  alightingPoint: { lat: number; lng: number };
}

/**
 * Renders colored circle markers for origin, destination,
 * boarding (snap-start), and alighting (snap-end) points.
 */
export default function SnapMarkers({
  origin,
  destination,
  boardingPoint,
  alightingPoint,
}: SnapMarkersProps) {
  return (
    <>
      {/* User's origin — blue dot */}
      <Marker longitude={origin.lng} latitude={origin.lat} anchor="center">
        <div
          title="Your starting point"
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#1a73e8",
            border: "3px solid white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        />
      </Marker>

      {/* User's destination — red dot */}
      <Marker
        longitude={destination.lng}
        latitude={destination.lat}
        anchor="center"
      >
        <div
          title="Your destination"
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#EA4335",
            border: "3px solid white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        />
      </Marker>

      {/* Boarding point — green dot with bus icon */}
      <Marker
        longitude={boardingPoint.lng}
        latitude={boardingPoint.lat}
        anchor="center"
      >
        <div
          title="Board bus here"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#34A853",
            border: "3px solid white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
          }}
        >
          🚌
        </div>
      </Marker>

      {/* Alighting point — orange dot */}
      <Marker
        longitude={alightingPoint.lng}
        latitude={alightingPoint.lat}
        anchor="center"
      >
        <div
          title="Get off bus here"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#FBBC04",
            border: "3px solid white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
          }}
        >
          📍
        </div>
      </Marker>
    </>
  );
}
