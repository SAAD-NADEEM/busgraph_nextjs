"use client";
import { useState, useRef } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import RouteLayer from "@/components/RouteLayer";
import SearchInput from "@/components/SearchInput";
import { getRoute } from "@/utils/getRoute";
import "mapbox-gl/dist/mapbox-gl.css";

export default function HomePage() {
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(
    null,
  );
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState(null);
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
    try {
      const origin = { lng: originCoords[0], lat: originCoords[1] };
      const dest = { lng: destCoords[0], lat: destCoords[1] };

      const coords = await getRoute(origin, dest);
      setRouteCoords(coords);

      mapRef.current?.fitBounds(
        [
          [origin.lng, origin.lat],
          [dest.lng, dest.lat],
        ],
        { padding: 80 },
      );
    } catch {
      setError("Could not find route.");
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
        {routeCoords && <RouteLayer coordinates={routeCoords} />}
      </Map>

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
      </div>
    </div>
  );
}
