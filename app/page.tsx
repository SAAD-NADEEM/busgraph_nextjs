"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Menu, Sun, Moon } from "lucide-react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import RouteLayer from "@/components/RouteLayer";
import WalkingLayer from "@/components/WalkingLayer";
import SnapMarkers, { MarkerPoint } from "@/components/SnapMarkers";
import LiveBusMarkers from "@/components/LiveBusMarkers";
import SideMenuSheet, { MenuTab } from "@/components/SideMenuSheet";
import SearchInput from "@/components/SearchInput";
import AllRoutesLayer, { RouteData } from "@/components/AllRoutesLayer";
import { getRouteColor } from "@/lib/routeColors";
import { getWalkingRoute } from "@/utils/walkingRoute";
import type { TransitOption } from "@/lib/routeMatcher";
import type { CommuteDemoState } from "@/lib/commuteTypes";
import {
  getActiveBusSpottings,
  getCommuteSnapshot,
  subscribeCommuteStore,
} from "@/lib/commuteStore";
import "mapbox-gl/dist/mapbox-gl.css";

interface WalkingLegState {
  id: string;
  coords: [number, number][];
  distanceM: number;
  durationSec: number;
}

export default function HomePage() {
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [originName, setOriginName] = useState("");
  const [destName, setDestName] = useState("");

  // Multi-option state
  const [options, setOptions] = useState<TransitOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Walking paths cache for selected option
  const [walkingLegs, setWalkingLegs] = useState<WalkingLegState[]>([]);

  // Side Menu & Tabs state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<MenuTab>("legend");
  const [allRoutes, setAllRoutes] = useState<RouteData[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string>>(new Set());

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const [mapTheme, setMapTheme] = useState<"dark" | "streets">("dark");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [commuteState, setCommuteState] = useState<CommuteDemoState | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setCommuteState(getCommuteSnapshot());

    // Load all routes on initial mount so all bus lines are drawn immediately
    setLoadingRoutes(true);
    fetch("/api/all-routes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RouteData[]) => {
        if (data.length > 0) {
          setAllRoutes(data);
          setVisibleRouteIds(new Set(data.map((r) => r.routeId)));
        }
      })
      .catch((err) => console.error("Failed to load all routes on mount:", err))
      .finally(() => setLoadingRoutes(false));

    return subscribeCommuteStore(() => {
      setCommuteState(getCommuteSnapshot());
    });
  }, []);

  const activeSpottings = commuteState ? getActiveBusSpottings(commuteState) : [];
  const activeBoarding = commuteState?.activeBoarding ?? null;

  const selectedOption =
    options.find((o) => o.id === selectedOptionId) || options[0] || null;
  const isDark = mapTheme === "dark";

  const handleOpenMenuTab = (tab: MenuTab = "legend") => {
    setMenuTab(tab);
    setMenuOpen(true);
    if (tab === "legend" && allRoutes.length === 0) {
      setLoadingRoutes(true);
      fetch("/api/all-routes")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: RouteData[]) => {
          if (data.length > 0) {
            setAllRoutes(data);
            setVisibleRouteIds(new Set(data.map((r) => r.routeId)));
          }
        })
        .catch((err) => console.error("Failed to load all routes:", err))
        .finally(() => setLoadingRoutes(false));
    }
  };

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
    setOriginName("");
    setDestName("");
    setOptions([]);
    setSelectedOptionId(null);
    setWalkingLegs([]);
    setError("");
    setSearchKey((k) => k + 1);
    setIsCollapsed(false);
    mapRef.current?.flyTo({ center: [67.0011, 24.8607], zoom: 12, duration: 800 });
  };

  // Fetch walking routes whenever the active option changes
  const loadOptionPaths = async (opt: TransitOption) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
    const legsToFetch: { id: string; from: { lat: number; lng: number }; to: { lat: number; lng: number } }[] = [];

    // Walk to first bus
    legsToFetch.push({
      id: "walk-start",
      from: opt.walkToStart.from,
      to: opt.walkToStart.to,
    });

    // Transfer walks (if multi-bus)
    opt.transfers.forEach((tr, i) => {
      legsToFetch.push({
        id: `walk-transfer-${i}`,
        from: tr.from,
        to: tr.to,
      });
    });

    // Walk from last bus to destination
    legsToFetch.push({
      id: "walk-end",
      from: opt.walkFromEnd.from,
      to: opt.walkFromEnd.to,
    });

    const results = await Promise.all(
      legsToFetch.map(async (item) => {
        const res = await getWalkingRoute(item.from, item.to, token);
        return {
          id: item.id,
          coords: res.coordinates,
          distanceM: res.distance,
          durationSec: res.duration,
        };
      })
    );

    setWalkingLegs(results);

    // Zoom and center map to include all legs
    const allLngs: number[] = [opt.walkToStart.from.lng, opt.walkFromEnd.to.lng];
    const allLats: number[] = [opt.walkToStart.from.lat, opt.walkFromEnd.to.lat];

    opt.legs.forEach((l) => {
      l.busPath.forEach(([lng, lat]) => {
        allLngs.push(lng);
        allLats.push(lat);
      });
    });

    if (allLngs.length > 0 && mapRef.current) {
      mapRef.current.fitBounds(
        [
          [Math.min(...allLngs), Math.min(...allLats)],
          [Math.max(...allLngs), Math.max(...allLats)],
        ],
        { padding: 80 }
      );
    }
  };

  const handleSelectOption = (optId: string) => {
    setSelectedOptionId(optId);
    const chosen = options.find((o) => o.id === optId);
    if (chosen) {
      loadOptionPaths(chosen);
    }
  };

  const handleSubmit = async () => {
    if (!originCoords || !destCoords) {
      setError("Please select both locations from the dropdown.");
      return;
    }
    setLoading(true);
    setError("");
    setOptions([]);
    setSelectedOptionId(null);
    setWalkingLegs([]);

    try {
      const origin = { lat: originCoords[1], lng: originCoords[0] };
      const destination = { lat: destCoords[1], lng: destCoords[0] };

      const res = await fetch("/api/find-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No route options found.");
      }

      const data = await res.json();
      const foundOptions: TransitOption[] = data.options || [];

      if (foundOptions.length === 0) {
        throw new Error("No routes found connecting these areas.");
      }

      setOptions(foundOptions);
      setSelectedOptionId(foundOptions[0].id);
      await loadOptionPaths(foundOptions[0]);
    } catch (err: any) {
      setError(err.message || "Could not find a route.");
    } finally {
      setLoading(false);
    }
  };

  // Build markers for the selected option
  const markers: MarkerPoint[] = [];
  if (selectedOption) {
    // User start
    markers.push({
      lat: selectedOption.walkToStart.from.lat,
      lng: selectedOption.walkToStart.from.lng,
      label: "Start",
      type: "origin",
      badge: "Origin",
    });

    // Each bus boarding / alighting
    selectedOption.legs.forEach((leg, i) => {
      // Boarding marker
      markers.push({
        lat: leg.boardPoint.lat,
        lng: leg.boardPoint.lng,
        label: i === 0 ? `Board ${leg.routeId} at ${leg.boardStopName}` : `Switch to ${leg.routeId} at ${leg.boardStopName}`,
        type: i === 0 ? "board" : "transfer",
        badge: i === 0 ? `Board ${leg.routeId}` : `Switch ➔ ${leg.routeId}`,
      });

      // Transfer exit marker (if not the last leg)
      if (i < selectedOption.legs.length - 1) {
        markers.push({
          lat: leg.alightPoint.lat,
          lng: leg.alightPoint.lng,
          label: `Alight ${leg.routeId} at ${leg.alightStopName}`,
          type: "transfer",
          badge: `Exit ${leg.routeId}`,
        });
      }

      // Final alighting marker
      if (i === selectedOption.legs.length - 1) {
        markers.push({
          lat: leg.alightPoint.lat,
          lng: leg.alightPoint.lng,
          label: `Alight ${leg.routeId} at ${leg.alightStopName}`,
          type: "alight",
          badge: `Exit ${leg.routeId}`,
        });
      }
    });

    // User destination
    markers.push({
      lat: selectedOption.walkFromEnd.to.lat,
      lng: selectedOption.walkFromEnd.to.lng,
      label: "Destination",
      type: "destination",
      badge: "Destination",
    });
  }

  const anyRouteVisible =
    !selectedOption && visibleRouteIds.size > 0 && allRoutes.length > 0;

  const FEEDER_THRESHOLD_M = 1800;

  const fmtDist = (m: number) =>
    m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(2)}km`;

  const fmtWalk = (distM: number, durationSec?: number) => {
    const mins = Math.max(1, Math.round((durationSec ?? distM / 1.33) / 60));
    return `~${mins} min${mins === 1 ? "" : "s"} (${fmtDist(distM)})`;
  };

  /** Renders first/last-mile mode as walk (<=1.8km) or rickshaw/chingchi feeder (>1.8km). */
  const renderAccessMode = (distM: number, durationSec?: number) => {
    const strongColor = isDark ? "#f8fafc" : "#0f172a";
    if (distM <= FEEDER_THRESHOLD_M) {
      return (
        <>
          Walk{" "}
          <strong style={{ color: strongColor }}>
            {fmtWalk(distM, durationSec)}
          </strong>
        </>
      );
    }
    const rickshawMins = Math.max(3, Math.round(distM / 360) + 2);
    return (
      <>
        Feeder / Rickshaw or Walk{" "}
        <strong style={{ color: isDark ? "#fdba74" : "#c2410c" }}>
          ~{rickshawMins} mins rickshaw ({fmtDist(distM)})
        </strong>{" "}
        <span style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
          (or {fmtWalk(distM, durationSec)} walk)
        </span>
      </>
    );
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 67.0011, latitude: 24.8607, zoom: 12 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={
          mapTheme === "dark"
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12"
        }
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />

        {/* Global route catalog */}
        {anyRouteVisible && (
          <AllRoutesLayer routes={allRoutes} visibleRouteIds={visibleRouteIds} />
        )}

        {/* Bus legs for current option — each with unique id and layer id */}
        {selectedOption &&
          selectedOption.legs.map((leg, i) => (
            <RouteLayer
              key={`bus-leg-${selectedOption.id}-${leg.routeId}-${i}`}
              id={`bus-${selectedOption.id}-${leg.routeId}-${i}`}
              coordinates={leg.busPath}
              color={getRouteColor(leg.routeId)}
            />
          ))}

        {/* Walking paths (street matched) */}
        {walkingLegs.map((w) => (
          <WalkingLayer key={w.id} id={w.id} coordinates={w.coords} />
        ))}

        {/* Markers */}
        <SnapMarkers markers={markers} />
        <LiveBusMarkers spottings={activeSpottings} dark={isDark} />
      </Map>

      {/* Floating Theme Toggle (Dark / Light) */}
      <button
        onClick={() => setMapTheme((t) => (t === "dark" ? "streets" : "dark"))}
        title={mapTheme === "dark" ? "Switch to Streets map" : "Switch to Dark map"}
        style={{
          position: "absolute",
          bottom: 142,
          right: 16,
          zIndex: 10,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: isDark ? "#1e293b" : "white",
          color: isDark ? "#f8fafc" : "#1e293b",
          border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Toggle map theme"
      >
        {mapTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Floating Menu Button (Routes & App Tabs) */}
      <button
        onClick={() => handleOpenMenuTab("legend")}
        title="Menu & App Features"
        style={{
          position: "absolute",
          bottom: 90,
          right: 16,
          zIndex: 10,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: isDark ? "#1e293b" : "white",
          color: isDark ? "#f8fafc" : "#1e293b",
          border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
          boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Unified Side Menu with Tabs (Routes, Dashboard, Live Buses, Coins, Route Chat) */}
      <SideMenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        activeTab={menuTab}
        onTabChange={setMenuTab}
        routes={allRoutes}
        loadingRoutes={loadingRoutes}
        visibleRouteIds={visibleRouteIds}
        onToggleRoute={handleToggleRoute}
        profile={commuteState?.profile ?? null}
        trips={commuteState?.trips ?? []}
        activeBoarding={activeBoarding}
        spottings={activeSpottings}
        coinBalance={commuteState?.profile.coinBalance ?? 0}
        transactions={commuteState?.transactions ?? []}
        chatMessages={commuteState?.chatMessages ?? []}
        selectedOption={selectedOption}
        onFocusLocation={(lat, lng) => {
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 700 });
        }}
        dark={isDark}
      />

      {/* ── Collapsed Floating Summary Panel ─────────────────────── */}
      {isCollapsed && (
        <div
          onClick={() => setIsCollapsed(false)}
          title="Click to expand search panel"
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            color: isDark ? "#f8fafc" : "#0f172a",
            border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
            padding: "12px 16px",
            borderRadius: "14px",
            boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.6)" : "0 4px 24px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "410px",
            maxWidth: "92vw",
            zIndex: 40,
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
          }}
        >
          {/* Header Row: Logo + BusGraph on left, Up Arrow button on right */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px", fontWeight: 700 }}>
              <img
                src="/icons/icon-192x192.png"
                alt="BusGraph"
                width={20}
                height={20}
                style={{ borderRadius: "4px", objectFit: "contain" }}
              />
              <span>BusGraph</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(false);
              }}
              title="Expand panel"
              style={{
                background: isDark ? "#1e293b" : "#f1f5f9",
                border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                color: isDark ? "#94a3b8" : "#475569",
                padding: "6px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Expand panel"
            >
              <ChevronUp size={16} />
            </button>
          </div>

          {/* Second Row: Bus Name + Km info in query state, or search text in no-query state */}
          {selectedOption ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                fontSize: "12px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 600, color: isDark ? "#93c5fd" : "#1d4ed8" }}>
                {selectedOption.type === "direct"
                  ? `Bus ${selectedOption.legs[0].routeId}`
                  : `${selectedOption.legs[0].routeId} ➔ ${selectedOption.legs[1].routeId}`}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  {fmtDist(selectedOption.totalBusDistanceM)} bus • {fmtDist(selectedOption.totalWalkDistanceM)} {selectedOption.needsFeeder ? "feeder/walk" : "walk"}
                </span>

                {(selectedOption.needsFeeder || selectedOption.isHighWalk) && (
                  <span
                    style={{
                      fontSize: 10,
                      background: selectedOption.needsFeeder
                        ? isDark
                          ? "#431407"
                          : "#ffedd5"
                        : isDark
                        ? "#451a03"
                        : "#fef3c7",
                      color: selectedOption.needsFeeder
                        ? isDark
                          ? "#fdba74"
                          : "#c2410c"
                        : isDark
                        ? "#fbbf24"
                        : "#b45309",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontWeight: 700,
                    }}
                  >
                    {selectedOption.needsFeeder ? "Feeder" : "High Walk"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: "12px",
                color: isDark ? "#94a3b8" : "#64748b",
              }}
            >
              {originName || destName
                ? `${originName ? originName.split(",")[0] : "Start"} ➔ ${destName ? destName.split(",")[0] : "Destination"}`
                : "Search routes across Karachi"}
            </div>
          )}
        </div>
      )}

      {/* ── Search & Results Panel ──────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: isDark ? "rgba(15, 23, 42, 0.95)" : "white",
          backdropFilter: "blur(12px)",
          color: isDark ? "#f8fafc" : "#0f172a",
          padding: "16px",
          borderRadius: "14px",
          boxShadow: isDark
            ? "0 10px 40px rgba(0,0,0,0.6)"
            : "0 4px 24px rgba(0,0,0,0.18)",
          border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
          display: isCollapsed ? "none" : "flex",
          flexDirection: "column",
          gap: "10px",
          width: "410px",
          maxWidth: "92vw",
          zIndex: 40,
          overflow: "visible",
        }}
      >
        {/* Header with Title & Collapse Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "2px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: "14px",
              color: isDark ? "#f8fafc" : "#0f172a",
            }}
          >
            <img
              src="/icons/icon-192x192.png"
              alt="BusGraph"
              width={20}
              height={20}
              style={{ borderRadius: "4px", objectFit: "contain" }}
            />
            <span>BusGraph</span>
          </div>

          <button
            onClick={() => setIsCollapsed(true)}
            title="Collapse panel"
            style={{
              background: isDark ? "#1e293b" : "#f1f5f9",
              border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
              color: isDark ? "#94a3b8" : "#475569",
              padding: "6px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Collapse panel"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Origin Search Input (higher z-index so dropdown floats over destination) */}
        <div style={{ position: "relative", zIndex: 30 }}>
          <SearchInput
            key={`origin-${searchKey}`}
            placeholder="Starting point"
            initialValue={originName}
            onSelect={(name, coords) => {
              setOriginCoords(coords);
              setOriginName(name);
            }}
            onClear={() => {
              setOriginCoords(null);
              setOriginName("");
            }}
            dark={isDark}
          />
        </div>

        {/* Destination Search Input (zIndex 20 so it floats over buttons) */}
        <div style={{ position: "relative", zIndex: 20 }}>
          <SearchInput
            key={`dest-${searchKey}`}
            placeholder="Destination"
            initialValue={destName}
            onSelect={(name, coords) => {
              setDestCoords(coords);
              setDestName(name);
            }}
            onClear={() => {
              setDestCoords(null);
              setDestName("");
            }}
            dark={isDark}
          />
        </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "10px",
              borderRadius: "8px",
              background: "#2563eb",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {loading ? "Searching best routes..." : "Find Routes"}
          </button>

          {options.length > 0 && (
            <button
              onClick={handleReset}
              style={{
                padding: "7px 10px",
                borderRadius: "8px",
                background: "transparent",
                color: isDark ? "#94a3b8" : "#6b7280",
                border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              ✕ Clear &amp; Start Over
            </button>
          )}

          {error && (
            <p style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>{error}</p>
          )}

          {/* ── Multiple Route Options Selector ─────────────────────── */}
          {options.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isDark ? "#94a3b8" : "#4b5563",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Suggested Route Options ({options.length}):
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  paddingBottom: 4,
                  scrollbarWidth: "thin",
                  scrollbarColor: isDark ? "#334155 transparent" : "#cbd5e1 transparent",
                }}
              >
                {options.map((opt, idx) => {
                  const isSelected = opt.id === selectedOptionId;
                  const isTransfer = opt.type === "transfer";
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      style={{
                        flex: "1 0 auto",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: isSelected
                          ? "2px solid #3b82f6"
                          : isDark
                          ? "1px solid #334155"
                          : "1px solid #e5e7eb",
                        background: isSelected
                          ? isDark
                            ? "#1e3a8a"
                            : "#eff6ff"
                          : isDark
                          ? "#1e293b"
                          : "#f9fafb",
                        cursor: "pointer",
                        textAlign: "left",
                        minWidth: 110,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 4,
                          color: isSelected
                            ? isDark
                              ? "#93c5fd"
                              : "#1a73e8"
                            : isDark
                            ? "#94a3b8"
                            : "#374151",
                        }}
                      >
                        <span>Option {idx + 1}</span>
                        {(opt.needsFeeder || opt.isHighWalk) && (
                          <span
                            style={{
                              fontSize: 9,
                              background: opt.needsFeeder
                                ? isDark
                                  ? "#431407"
                                  : "#ffedd5"
                                : isDark
                                ? "#451a03"
                                : "#fef3c7",
                              color: opt.needsFeeder
                                ? isDark
                                  ? "#fdba74"
                                  : "#c2410c"
                                : isDark
                                ? "#fbbf24"
                                : "#b45309",
                              padding: "1px 5px",
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            {opt.needsFeeder ? "Feeder" : "High Walk"}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isDark ? "#f8fafc" : "#111827",
                          marginTop: 2,
                        }}
                      >
                        {isTransfer
                          ? `${opt.legs[0].routeId} ➔ ${opt.legs[1].routeId}`
                          : opt.legs[0].routeId}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: isDark ? "#94a3b8" : "#6b7280",
                          marginTop: 2,
                        }}
                      >
                        {fmtDist(opt.totalWalkDistanceM)} {opt.needsFeeder ? "feeder/walk" : "walk"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Selected Option Step-by-Step Card ────────────────────── */}
          {selectedOption && (() => {
            const walkStartLeg = walkingLegs.find((w) => w.id === "walk-start");
            const walkEndLeg = walkingLegs.find((w) => w.id === "walk-end");

            return (
              <div
                style={{
                  marginTop: "4px",
                  padding: "14px",
                  background: isDark ? "#0b1329" : "#f8fafc",
                  borderRadius: "10px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                  maxHeight: "50vh",
                  overflowY: "auto",
                  scrollbarWidth: "thin",
                  scrollbarColor: isDark ? "#334155 transparent" : "#cbd5e1 transparent",
                }}
              >
                {/* Option Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                    paddingBottom: 8,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: isDark ? "#f8fafc" : "#1e293b",
                      fontSize: "14px",
                    }}
                  >
                    {selectedOption.type === "direct" ? "Direct Journey" : "Transfer Journey"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      background:
                        selectedOption.type === "direct"
                          ? isDark
                            ? "#064e3b"
                            : "#dcfce7"
                          : isDark
                          ? "#3b0764"
                          : "#f3e8ff",
                      color:
                        selectedOption.type === "direct"
                          ? isDark
                            ? "#6ee7b7"
                            : "#166534"
                          : isDark
                          ? "#d8b4fe"
                          : "#6b21a8",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontWeight: 600,
                    }}
                  >
                    {selectedOption.type === "direct" ? "1 Bus" : "2 Buses (1 Switch)"}
                  </span>
                </div>

                {/* Step 1: First-mile leg (walk or feeder) with explicit stop name */}
                <div style={{ padding: "6px 0", color: isDark ? "#cbd5e1" : "#334155" }}>
                  {renderAccessMode(
                    walkStartLeg?.distanceM ?? selectedOption.walkToStart.distanceM,
                    walkStartLeg?.durationSec
                  )}
                  <div
                    style={{
                      fontSize: "12px",
                      color: isDark ? "#2dd4bf" : "#0f766e",
                      fontWeight: 600,
                      marginTop: 2,
                      paddingLeft: "18px",
                    }}
                  >
                    Boarding Stop: {selectedOption.legs[0].boardStopName}
                  </div>
                </div>

                {/* Legs display with explicit boarding and alighting/switch stops */}
                {selectedOption.legs.map((leg, i) => {
                  const legColor = getRouteColor(leg.routeId);
                  const transferLeg = walkingLegs.find((w) => w.id === `walk-transfer-${i}`);
                  const isLastLeg = i === selectedOption.legs.length - 1;

                  return (
                    <div key={`opt-leg-${i}`} style={{ margin: "4px 0" }}>
                      {/* Bus Ride segment */}
                      <div
                        style={{
                          padding: "8px 10px",
                          background: isDark ? "#1e293b" : "white",
                          borderRadius: "8px",
                          border: isDark ? "1px solid #334155" : "none",
                          borderLeftWidth: "4px",
                          borderLeftStyle: "solid",
                          borderLeftColor: legColor,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          margin: "4px 0",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: legColor, fontSize: "13px" }}>
                          Ride {leg.routeId} ({fmtDist(leg.rideDistanceM)})
                        </div>
                        <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                          {leg.routeName}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: isDark ? "#cbd5e1" : "#475569",
                            marginTop: "4px",
                          }}
                        >
                          • Board at:{" "}
                          <strong style={{ color: isDark ? "#f8fafc" : "#1e293b" }}>
                            {leg.boardStopName}
                          </strong>
                        </div>
                        <div style={{ fontSize: "12px", color: isDark ? "#cbd5e1" : "#475569" }}>
                          • Alight at:{" "}
                          <strong style={{ color: isDark ? "#f8fafc" : "#1e293b" }}>
                            {leg.alightStopName}
                          </strong>
                        </div>
                      </div>

                      {/* Switch/Transfer Section */}
                      {!isLastLeg && (
                        <div
                          style={{
                            margin: "8px 0",
                            padding: "8px 10px",
                            background: isDark ? "#291e0a" : "#fef3c7",
                            border: isDark ? "1px solid #78350f" : "1px solid #fde68a",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: isDark ? "#fef08a" : "#92400e",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            Switch Buses: {leg.routeId} ➔ {selectedOption.legs[i + 1].routeId}
                          </div>
                          <div style={{ marginTop: 2 }}>
                            • Get off <strong>{leg.routeId}</strong> at:{" "}
                            <strong>{leg.alightStopName}</strong>
                          </div>
                          <div>
                            • Walk{" "}
                            {fmtWalk(
                              transferLeg?.distanceM ?? selectedOption.transfers[i]?.distanceM ?? 0,
                              transferLeg?.durationSec
                            )}{" "}
                            to switch
                          </div>
                          <div>
                            • Catch <strong>{selectedOption.legs[i + 1].routeId}</strong> at:{" "}
                            <strong>{selectedOption.legs[i + 1].boardStopName}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Step Last: Last-mile leg (walk or feeder) with explicit ending stop */}
                <div style={{ padding: "6px 0", color: isDark ? "#cbd5e1" : "#334155" }}>
                  {renderAccessMode(
                    walkEndLeg?.distanceM ?? selectedOption.walkFromEnd.distanceM,
                    walkEndLeg?.durationSec
                  )}{" "}
                  from{" "}
                  <strong style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                    {selectedOption.legs[selectedOption.legs.length - 1].alightStopName}
                  </strong>{" "}
                  to your final destination
                </div>

                {/* Totals footer */}
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "8px",
                    borderTop: isDark ? "1px dashed #334155" : "1px dashed #cbd5e1",
                    fontSize: "11px",
                    color: isDark ? "#94a3b8" : "#64748b",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    Total Walking:{" "}
                    <strong style={{ color: isDark ? "#f8fafc" : "#1e293b" }}>
                      {fmtDist(selectedOption.totalWalkDistanceM)}
                    </strong>
                  </span>
                  <span>
                    Total Bus Ride:{" "}
                    <strong style={{ color: isDark ? "#f8fafc" : "#1e293b" }}>
                      {fmtDist(selectedOption.totalBusDistanceM)}
                    </strong>
                  </span>
                </div>

                {/* Quick Step-1 Board / Exit CTA tied to active route */}
                <button
                  type="button"
                  onClick={() => handleOpenMenuTab("tracker")}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    background: activeBoarding ? "#059669" : "#2563eb",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {activeBoarding
                    ? `Riding ${activeBoarding?.routeId} — Tap When You Exit (+15 Coins)`
                    : `Boarded ${selectedOption.legs[0].routeId}? Broadcast Live Location`}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenMenuTab("chat")}
                  style={{
                    marginTop: "6px",
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#cbd5e1" : "#334155",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Open #{selectedOption.legs[0].routeId}-chat Commuter Channel
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }
