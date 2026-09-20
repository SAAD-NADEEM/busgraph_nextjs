"use client";
import { useState, useRef } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import RouteLayer from "@/components/RouteLayer";
import WalkingLayer from "@/components/WalkingLayer";
import SnapMarkers from "@/components/SnapMarkers";
import SearchInput from "@/components/SearchInput";
import AllRoutesLayer, { RouteData } from "@/components/AllRoutesLayer";
import RouteLegendSheet from "@/components/RouteLegendSheet";
import { getRouteColor } from "@/lib/routeColors";
import { getWalkingRoute } from "@/utils/walkingRoute";
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
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routeMatch, setRouteMatch] = useState<RouteMatch | null>(null);
  // Routed walking path coordinates from Mapbox Directions API
  const [walkToStartCoords, setWalkToStartCoords] = useState<[number, number][]>([]);
  const [walkFromEndCoords, setWalkFromEndCoords] = useState<[number, number][]>([]);

  // Legend sheet state
  const [legendOpen, setLegendOpen] = useState(false);
  const [allRoutes, setAllRoutes] = useState<RouteData[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  // Per-route visibility — only routes in this set are rendered on the map
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string>>(new Set());

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Incrementing this key force-remounts SearchInput fields (clears their text)
  const [searchKey, setSearchKey] = useState(0);
  const mapRef = useRef<any>(null);

  /** Open the legend sheet and lazily fetch routes the first time */
  const handleOpenLegend = async () => {
    setLegendOpen(true);
    if (allRoutes.length === 0) {
      setLoadingRoutes(true);
      try {
        const res = await fetch("/api/all-routes");
        if (res.ok) {
          const data: RouteData[] = await res.json();
          setAllRoutes(data);
          // Start with all routes visible when first loaded
          setVisibleRouteIds(new Set(data.map((r) => r.routeId)));
        }
      } catch (err) {
        console.error("Failed to load all routes:", err);
      } finally {
        setLoadingRoutes(false);
      }
    }
  };

  /** Toggle a single route on/off */
  const handleToggleRoute = (routeId: string, checked: boolean) => {
    setVisibleRouteIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(routeId);
      else next.delete(routeId);
      return next;
    });
  };

  const handleReset = () => {
    setOriginCoords(null);
    setDestCoords(null);
    setRouteMatch(null);
    setWalkToStartCoords([]);
    setWalkFromEndCoords([]);
    setError("");
    setSearchKey((k) => k + 1); // clears SearchInput text
    mapRef.current?.flyTo({ center: [67.0011, 24.8607], zoom: 12, duration: 800 });
  };

  const handleSubmit = async () => {
    if (!originCoords || !destCoords) {
      setError("Please select both locations from the dropdown.");
      return;
    }
    setLoading(true);
    setError("");
    setRouteMatch(null);
    setWalkToStartCoords([]);
    setWalkFromEndCoords([]);

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

      // Fetch walking routes from Mapbox Directions API in parallel
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
      const [toStartCoords, fromEndCoords] = await Promise.all([
        getWalkingRoute(match.walkToStart.from, match.walkToStart.to, token),
        getWalkingRoute(match.walkFromEnd.from, match.walkFromEnd.to, token),
      ]);
      setWalkToStartCoords(toStartCoords);
      setWalkFromEndCoords(fromEndCoords);

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

  const anyRouteVisible = visibleRouteIds.size > 0 && allRoutes.length > 0;

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

        {/* All bus routes layer — only checked routes are rendered */}
        {anyRouteVisible && (
          <AllRoutesLayer routes={allRoutes} visibleRouteIds={visibleRouteIds} />
        )}

        {/* Bus route polyline (with official company color) */}
        {routeMatch && (
          <RouteLayer
            coordinates={routeMatch.busPath}
            color={getRouteColor(routeMatch.routeId)}
          />
        )}

        {/* Walking: user origin → boarding point (road-following dashed line) */}
        {walkToStartCoords.length >= 2 && (
          <WalkingLayer id="to-start" coordinates={walkToStartCoords} />
        )}

        {/* Walking: alighting point → user destination (road-following dashed line) */}
        {walkFromEndCoords.length >= 2 && (
          <WalkingLayer id="from-end" coordinates={walkFromEndCoords} />
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

      {/* ── Floating legend button (bottom-right, above nav control) ────── */}
      <button
        onClick={handleOpenLegend}
        title="Map Legend"
        style={{
          position: "absolute",
          bottom: 90,
          right: 16,
          zIndex: 10,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "white",
          border: "none",
          boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          transition: "box-shadow 0.2s, transform 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.32)";
          e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.22)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        🗺️
      </button>

      {/* ── Legend sheet ─────────────────────────────────────────────────── */}
      <RouteLegendSheet
        open={legendOpen}
        onOpenChange={setLegendOpen}
        routes={allRoutes}
        loading={loadingRoutes}
        visibleRouteIds={visibleRouteIds}
        onToggleRoute={handleToggleRoute}
      />

      {/* ── Search panel (top-center) ─────────────────────────────────────── */}
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
          key={`origin-${searchKey}`}
          placeholder="Starting point"
          onSelect={(_, coords) => setOriginCoords(coords)}
        />
        <SearchInput
          key={`dest-${searchKey}`}
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

        {/* Reset button — only visible when a result is showing */}
        {routeMatch && (
          <button
            onClick={handleReset}
            style={{
              padding: "8px 10px",
              borderRadius: "8px",
              background: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            ✕ Clear &amp; start over
          </button>
        )}

        {error && (
          <p style={{ color: "red", fontSize: "13px", margin: 0 }}>{error}</p>
        )}

        {/* Route info card */}
        {routeMatch && (() => {
          // Compute bus path distance from coordinate pairs (haversine approximation)
          const toRad = (d: number) => (d * Math.PI) / 180;
          let busDistM = 0;
          for (let i = 1; i < routeMatch.busPath.length; i++) {
            const [lng1, lat1] = routeMatch.busPath[i - 1];
            const [lng2, lat2] = routeMatch.busPath[i];
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
            busDistM += 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          }
          const fmt = (m: number) => `${(m / 1000).toFixed(2)}km`;

          const routeLabel =
            routeMatch.routeName.match(/\((.+)\)/)?.[1] ||
            routeMatch.routeName;
          const routeColor = getRouteColor(routeMatch.routeId);

          return (
            <div
              style={{
                marginTop: "4px",
                padding: "10px 12px",
                background: "#f0f7ff",
                borderRadius: "8px",
                fontSize: "13px",
                lineHeight: "1.8",
              }}
            >
              {/* Walk to boarding point */}
              <div style={{ color: "#555" }}>
                🚶 Walk {fmt(routeMatch.startNode.distance)} to board
              </div>

              {/* Bus segment */}
              <div
                style={{
                  fontWeight: 600,
                  color: routeColor,
                  borderLeft: `3px solid ${routeColor}`,
                  paddingLeft: "8px",
                  margin: "4px 0",
                }}
              >
                🚌 {routeMatch.routeId} — {routeLabel}
                <span
                  style={{ fontWeight: 400, color: "#666", marginLeft: "6px" }}
                >
                  ({fmt(busDistM)})
                </span>
              </div>

              {/* Walk to destination */}
              <div style={{ color: "#555" }}>
                🚶 Walk {fmt(routeMatch.endNode.distance)} to destination
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
