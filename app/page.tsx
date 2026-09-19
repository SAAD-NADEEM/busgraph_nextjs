"use client";
import { useState, useRef } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import RouteLayer from "@/components/RouteLayer";
import WalkingLayer from "@/components/WalkingLayer";
import SnapMarkers from "@/components/SnapMarkers";
import SearchInput from "@/components/SearchInput";
import "mapbox-gl/dist/mapbox-gl.css";

/** Shape returned by POST /api/find-route */
interface RouteMatch {
  routeId: string;
  routeName: string;
  direction: string;
  startNode: { point: { lat: number; lng: number }; index: number; distance: number };
  endNode: { point: { lat: number; lng: number }; index: number; distance: number };
  busPath: [number, number][];
  walkToStart: { from: { lat: number; lng: number }; to: { lat: number; lng: number } };
  walkFromEnd: { from: { lat: number; lng: number }; to: { lat: number; lng: number } };
  totalSnapDistance: number;
}

export default function HomePage() {
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(
    null,
  );
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routeMatch, setRouteMatch] = useState<RouteMatch | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<any>(null);

  const handleSubmit = async () => {
    if (!originCoords || !destCoords) {
      setError("Please select both locations from the dropdown.");
      return;
    }
    setLoading(true);
    setError("");
    setRouteMatch(null);

    try {
      // originCoords from Nominatim/SearchInput are [lng, lat]
      const origin = { lat: originCoords[1], lng: originCoords[0] };
      const destination = { lat: destCoords[1], lng: destCoords[0] };

      const res = await fetch("/api/find-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No route found.");
      }

      const match: RouteMatch = await res.json();
      setRouteMatch(match);

      // Fit the map to include the full bus path + walking endpoints
      const allLngs = [
        origin.lng,
        destination.lng,
        match.startNode.point.lng,
        match.endNode.point.lng,
      ];
      const allLats = [
        origin.lat,
        destination.lat,
        match.startNode.point.lat,
        match.endNode.point.lat,
      ];

      mapRef.current?.fitBounds(
        [
          [Math.min(...allLngs), Math.min(...allLats)],
          [Math.max(...allLngs), Math.max(...allLats)],
        ],
        { padding: 80 },
      );
    } catch (err: any) {
      setError(err.message || "Could not find a bus route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 67.0011, latitude: 24.8607, zoom: 12 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />

        {/* Bus route polyline (solid blue with white casing) */}
        {routeMatch && <RouteLayer coordinates={routeMatch.busPath} />}

        {/* Walking: user origin → boarding point (dashed gray) */}
        {routeMatch && (
          <WalkingLayer
            id="to-start"
            from={routeMatch.walkToStart.from}
            to={routeMatch.walkToStart.to}
          />
        )}

        {/* Walking: alighting point → user destination (dashed gray) */}
        {routeMatch && (
          <WalkingLayer
            id="from-end"
            from={routeMatch.walkFromEnd.from}
            to={routeMatch.walkFromEnd.to}
          />
        )}

        {/* Markers for origin, destination, boarding & alighting */}
        {routeMatch && (
          <SnapMarkers
            origin={routeMatch.walkToStart.from}
            destination={routeMatch.walkFromEnd.to}
            boardingPoint={routeMatch.startNode.point}
            alightingPoint={routeMatch.endNode.point}
          />
        )}
      </Map>

      {/* Search panel */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "white",
          padding: "16px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "360px",
          zIndex: 10,
        }}
      >
        <SearchInput
          placeholder="Starting point"
          onSelect={(_, coords) => setOriginCoords(coords)}
        />
        <SearchInput
          placeholder="Destination"
          onSelect={(_, coords) => setDestCoords(coords)}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "10px",
            borderRadius: "8px",
            background: "#1a73e8",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Finding route..." : "Get Route"}
        </button>
        {error && (
          <p style={{ color: "red", fontSize: "13px", margin: 0 }}>{error}</p>
        )}

        {/* Route info card */}
        {routeMatch && (
          <div
            style={{
              marginTop: "4px",
              padding: "10px 12px",
              background: "#f0f7ff",
              borderRadius: "8px",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            <div style={{ fontWeight: 600, color: "#1a73e8", marginBottom: 4 }}>
              🚌 {routeMatch.routeId} — {routeMatch.routeName.match(/\((.+)\)/)?.[1] || routeMatch.routeName}
            </div>
            <div style={{ color: "#555" }}>
              🚶 Walk {Math.round(routeMatch.startNode.distance)}m to board
            </div>
            <div style={{ color: "#555" }}>
              🚶 Walk {Math.round(routeMatch.endNode.distance)}m from stop
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
