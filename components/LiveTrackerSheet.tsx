"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getRouteColor } from "@/lib/routeColors";
import { haversineDistance } from "@/lib/haversine";
import { KARACHI_TRANSIT_STOPS } from "@/lib/stopResolver";
import type { TransitOption } from "@/lib/routeMatcher";
import {
  ActiveBoardingSession,
  AVAILABLE_ROUTE_IDS,
  CASHOUT_THRESHOLD_COINS,
  CROWD_META,
  CrowdLevel,
  ExitBusResult,
  formatTimeAgo,
  LiveBusSpotting,
} from "@/lib/commuteTypes";
import { boardBus, exitBus, updateLiveSpottingCrowd } from "@/lib/commuteStore";

function findNearestHubName(lat: number, lng: number): string {
  let best = KARACHI_TRANSIT_STOPS[0];
  let bestDist = Infinity;
  for (const hub of KARACHI_TRANSIT_STOPS) {
    const d = haversineDistance({ lat, lng }, hub.point);
    if (d < bestDist) {
      bestDist = d;
      best = hub;
    }
  }
  return bestDist <= 3000
    ? `Near ${best.name}`
    : `GPS Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

function formatElapsed(boardedAtIso: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(boardedAtIso).getTime()) / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export interface LiveTrackerViewProps {
  activeBoarding: ActiveBoardingSession | null;
  spottings: LiveBusSpotting[];
  coinBalance: number;
  selectedOption: TransitOption | null;
  onFocusLocation: (lat: number, lng: number) => void;
  dark?: boolean;
}

export function LiveTrackerView({
  activeBoarding,
  spottings,
  coinBalance,
  selectedOption,
  onFocusLocation,
  dark = true,
}: LiveTrackerViewProps) {
  const plannedFirstLeg = selectedOption?.legs[0] ?? null;
  const plannedLastLeg = selectedOption?.legs[selectedOption.legs.length - 1] ?? null;

  const [routeId, setRouteId] = useState<string>("R11");
  const [boardSource, setBoardSource] = useState<"planned" | "stop" | "gps">("stop");
  const [selectedHubIdx, setSelectedHubIdx] = useState<number>(0);
  const [exitHubIdx, setExitHubIdx] = useState<number>(1);
  const [exitSource, setExitSource] = useState<"planned" | "stop" | "gps">("stop");
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>("seats");

  const [gpsCoord, setGpsCoord] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("");
  const [elapsedLabel, setElapsedLabel] = useState<string>("00:00");
  const [lastReceipt, setLastReceipt] = useState<ExitBusResult | null>(null);

  useEffect(() => {
    if (plannedFirstLeg && !activeBoarding) {
      setRouteId(plannedFirstLeg.routeId);
      setBoardSource("planned");
    }
    if (activeBoarding?.plannedAlightStopName) {
      setExitSource("planned");
    } else {
      setExitSource("stop");
    }
  }, [plannedFirstLeg, activeBoarding]);

  useEffect(() => {
    if (!activeBoarding) return;
    setElapsedLabel(formatElapsed(activeBoarding.boardedAt));
    const timer = setInterval(() => {
      setElapsedLabel(formatElapsed(activeBoarding.boardedAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeBoarding]);

  const sortedHubs = useMemo(
    () => [...KARACHI_TRANSIT_STOPS].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const requestGps = (onReady?: (loc: { lat: number; lng: number; label: string }) => void) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("Geolocation unavailable in this browser — pick a stop instead.");
      return;
    }
    setGpsStatus("Reading GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const loc = { lat, lng, label: findNearestHubName(lat, lng) };
        setGpsCoord(loc);
        setGpsStatus(`GPS locked: ${loc.label}`);
        onReady?.(loc);
      },
      () => {
        setGpsStatus("Location permission denied or timed out — use Stop Picker.");
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 15000 }
    );
  };

  const handleBoardConfirm = () => {
    setLastReceipt(null);
    let boardStopName = sortedHubs[selectedHubIdx].name;
    let boardLat = sortedHubs[selectedHubIdx].point.lat;
    let boardLng = sortedHubs[selectedHubIdx].point.lng;

    if (boardSource === "planned" && plannedFirstLeg) {
      boardStopName = plannedFirstLeg.boardStopName;
      boardLat = plannedFirstLeg.boardPoint.lat;
      boardLng = plannedFirstLeg.boardPoint.lng;
    } else if (boardSource === "gps" && gpsCoord) {
      boardStopName = gpsCoord.label;
      boardLat = gpsCoord.lat;
      boardLng = gpsCoord.lng;
    }

    boardBus({
      routeId,
      boardStopName,
      boardLat,
      boardLng,
      crowdLevel,
      plannedAlightStopName:
        boardSource === "planned" && plannedLastLeg ? plannedLastLeg.alightStopName : undefined,
      plannedAlightLat:
        boardSource === "planned" && plannedLastLeg ? plannedLastLeg.alightPoint.lat : undefined,
      plannedAlightLng:
        boardSource === "planned" && plannedLastLeg ? plannedLastLeg.alightPoint.lng : undefined,
      plannedBusDistanceM:
        boardSource === "planned" && selectedOption ? selectedOption.totalBusDistanceM : undefined,
      plannedWalkDistanceM:
        boardSource === "planned" && selectedOption ? selectedOption.totalWalkDistanceM : undefined,
    });

    onFocusLocation(boardLat, boardLng);
  };

  const handleExitConfirm = () => {
    if (!activeBoarding) return;
    let alightStopName = sortedHubs[exitHubIdx].name;
    let alightLat = sortedHubs[exitHubIdx].point.lat;
    let alightLng = sortedHubs[exitHubIdx].point.lng;

    if (
      exitSource === "planned" &&
      activeBoarding.plannedAlightStopName &&
      activeBoarding.plannedAlightLat !== undefined &&
      activeBoarding.plannedAlightLng !== undefined
    ) {
      alightStopName = activeBoarding.plannedAlightStopName;
      alightLat = activeBoarding.plannedAlightLat;
      alightLng = activeBoarding.plannedAlightLng;
    } else if (exitSource === "gps" && gpsCoord) {
      alightStopName = gpsCoord.label;
      alightLat = gpsCoord.lat;
      alightLng = gpsCoord.lng;
    }

    const result = exitBus({
      alightStopName,
      alightLat,
      alightLng,
    });
    setLastReceipt(result);
    onFocusLocation(alightLat, alightLng);
  };

  const cardBg = dark ? "#0f172a" : "#ffffff";
  const subCardBg = dark ? "#1e293b" : "#f8fafc";
  const borderCol = dark ? "#334155" : "#e2e8f0";
  const textPrimary = dark ? "#f8fafc" : "#0f172a";
  const textSecondary = dark ? "#94a3b8" : "#64748b";

  return (
    <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── Recent Completed Trip Receipt ───────────────────── */}
      {lastReceipt && !activeBoarding && (
        <div
          style={{
            padding: "12px",
            borderRadius: "10px",
            background: dark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5",
            border: dark ? "1px solid #065f46" : "1px solid #a7f3d0",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, color: dark ? "#34d399" : "#047857" }}>
            <span>Trip Logged (+{lastReceipt.coinsEarned} Coins)</span>
            <button
              type="button"
              onClick={() => setLastReceipt(null)}
              style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          <div style={{ marginTop: 6, color: textPrimary, fontWeight: 600 }}>
            {lastReceipt.trip.routeId}: {lastReceipt.trip.boardStopName} ➔ {lastReceipt.trip.alightStopName}
          </div>
          <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, color: textSecondary, fontSize: "11px" }}>
            <span>Bus: <strong>{lastReceipt.trip.busDistanceKm} km</strong></span>
            <span>Fare: <strong>Rs. {lastReceipt.trip.farePkr}</strong></span>
            <span>Saved: <strong>Rs. {lastReceipt.trip.savingsPkr}</strong></span>
            <span>Balance: <strong>{lastReceipt.newBalance}/{CASHOUT_THRESHOLD_COINS}</strong></span>
          </div>
        </div>
      )}

      {/* ── STATE A: Currently Riding ("I Exited" Controls) ─── */}
      {activeBoarding ? (
        <div
          style={{
            padding: "14px",
            borderRadius: "12px",
            background: subCardBg,
            border: `1px solid ${getRouteColor(activeBoarding.routeId)}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                background: getRouteColor(activeBoarding.routeId),
                color: "white",
                fontSize: "12px",
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              Riding {activeBoarding.routeId}
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "13px",
                color: dark ? "#4ade80" : "#15803d",
              }}
            >
              ● LIVE {elapsedLabel}
            </span>
          </div>

          <div style={{ marginTop: 10, fontSize: "12px", color: textSecondary }}>
            Boarded at:{" "}
            <strong style={{ color: textPrimary }}>{activeBoarding.boardStopName}</strong>
          </div>
          <div style={{ fontSize: "11px", color: dark ? "#38bdf8" : "#0284c7", marginTop: 2 }}>
            ✓ Your live bus pin is broadcasting on the map
          </div>

          {/* Quick Crowd Level Update mid-ride */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: textSecondary, marginBottom: 5 }}>
              Update Crowd Level
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {(["seats", "standing", "crowded"] as CrowdLevel[]).map((lvl) => {
                const meta = CROWD_META[lvl];
                const active = activeBoarding.crowdLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateLiveSpottingCrowd(lvl)}
                    style={{
                      padding: "6px 4px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: active ? `1px solid ${meta.color}` : `1px solid ${borderCol}`,
                      background: active ? `${meta.color}22` : cardBg,
                      color: active ? meta.color : textSecondary,
                    }}
                  >
                    {meta.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exit Stop Selection */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: textSecondary, marginBottom: 5 }}>
              Select Exit Stop
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {activeBoarding.plannedAlightStopName && (
                <button
                  type="button"
                  onClick={() => setExitSource("planned")}
                  style={{
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: `1px solid ${exitSource === "planned" ? "#3b82f6" : borderCol}`,
                    background: exitSource === "planned" ? "#2563eb22" : cardBg,
                    color: exitSource === "planned" ? "#60a5fa" : textSecondary,
                  }}
                >
                  Route Stop
                </button>
              )}
              <button
                type="button"
                onClick={() => setExitSource("stop")}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: `1px solid ${exitSource === "stop" ? "#3b82f6" : borderCol}`,
                  background: exitSource === "stop" ? "#2563eb22" : cardBg,
                  color: exitSource === "stop" ? "#60a5fa" : textSecondary,
                }}
              >
                Pick Stop
              </button>
              <button
                type="button"
                onClick={() => {
                  setExitSource("gps");
                  requestGps();
                }}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: `1px solid ${exitSource === "gps" ? "#3b82f6" : borderCol}`,
                  background: exitSource === "gps" ? "#2563eb22" : cardBg,
                  color: exitSource === "gps" ? "#60a5fa" : textSecondary,
                }}
              >
                Use GPS
              </button>
            </div>

            {exitSource === "planned" && activeBoarding.plannedAlightStopName && (
              <div style={{ fontSize: "12px", padding: "8px", borderRadius: "8px", background: cardBg, border: `1px solid ${borderCol}`, color: textPrimary }}>
                {activeBoarding.plannedAlightStopName}
              </div>
            )}

            {exitSource === "stop" && (
              <select
                value={exitHubIdx}
                onChange={(e) => setExitHubIdx(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  background: cardBg,
                  color: textPrimary,
                  border: `1px solid ${borderCol}`,
                  fontSize: "12px",
                }}
              >
                {sortedHubs.map((hub, i) => (
                  <option key={hub.name} value={i}>
                    {hub.name}
                  </option>
                ))}
              </select>
            )}

            {exitSource === "gps" && (
              <div style={{ fontSize: "11px", color: textSecondary }}>
                {gpsStatus || "Acquiring GPS..."}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExitConfirm}
            disabled={exitSource === "gps" && !gpsCoord}
            style={{
              marginTop: 14,
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              background: exitSource === "gps" && !gpsCoord ? "#475569" : "#ef4444",
              color: "white",
              fontWeight: 700,
              fontSize: "13px",
              cursor: exitSource === "gps" && !gpsCoord ? "not-allowed" : "pointer",
            }}
          >
            I Exited Bus (+15 Coins)
          </button>
        </div>
      ) : (
        /* ── STATE B: Not Riding ("I Boarded" Form) ─────────── */
        <div
          style={{
            padding: "14px",
            borderRadius: "12px",
            background: subCardBg,
            border: `1px solid ${borderCol}`,
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 700, color: textPrimary, marginBottom: 10 }}>
            Board &amp; Spot a Live Bus
          </div>

          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: textSecondary, marginBottom: 4 }}>
            Which Bus Route?
          </label>
          <select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "8px",
              background: cardBg,
              color: textPrimary,
              border: `1px solid ${borderCol}`,
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            {AVAILABLE_ROUTE_IDS.map((id) => (
              <option key={id} value={id}>
                Bus {id}
              </option>
            ))}
          </select>

          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: textSecondary, marginBottom: 4 }}>
            Boarding Stop / Location
          </label>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {plannedFirstLeg && (
              <button
                type="button"
                onClick={() => setBoardSource("planned")}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: `1px solid ${boardSource === "planned" ? "#3b82f6" : borderCol}`,
                  background: boardSource === "planned" ? "#2563eb22" : cardBg,
                  color: boardSource === "planned" ? "#60a5fa" : textSecondary,
                }}
              >
                Planned Stop
              </button>
            )}
            <button
              type="button"
              onClick={() => setBoardSource("stop")}
              style={{
                fontSize: "11px",
                padding: "4px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                border: `1px solid ${boardSource === "stop" ? "#3b82f6" : borderCol}`,
                background: boardSource === "stop" ? "#2563eb22" : cardBg,
                color: boardSource === "stop" ? "#60a5fa" : textSecondary,
              }}
            >
              Pick Stop
            </button>
            <button
              type="button"
              onClick={() => {
                setBoardSource("gps");
                requestGps();
              }}
              style={{
                fontSize: "11px",
                padding: "4px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                border: `1px solid ${boardSource === "gps" ? "#3b82f6" : borderCol}`,
                background: boardSource === "gps" ? "#2563eb22" : cardBg,
                color: boardSource === "gps" ? "#60a5fa" : textSecondary,
              }}
            >
              Use GPS
            </button>
          </div>

          {boardSource === "planned" && plannedFirstLeg && (
            <div
              style={{
                padding: "8px",
                borderRadius: "8px",
                background: cardBg,
                border: `1px solid ${borderCol}`,
                fontSize: "12px",
                color: textPrimary,
                marginBottom: 10,
              }}
            >
              {plannedFirstLeg.boardStopName}
            </div>
          )}

          {boardSource === "stop" && (
            <select
              value={selectedHubIdx}
              onChange={(e) => setSelectedHubIdx(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "8px",
                background: cardBg,
                color: textPrimary,
                border: `1px solid ${borderCol}`,
                fontSize: "12px",
                marginBottom: 10,
              }}
            >
              {sortedHubs.map((hub, i) => (
                <option key={hub.name} value={i}>
                  {hub.name}
                </option>
              ))}
            </select>
          )}

          {boardSource === "gps" && (
            <div style={{ fontSize: "11px", color: textSecondary, marginBottom: 10 }}>
              {gpsStatus || "Acquiring GPS..."}
            </div>
          )}

          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: textSecondary, marginBottom: 4 }}>
            Crowd Status Inside Bus
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
            {(["seats", "standing", "crowded"] as CrowdLevel[]).map((lvl) => {
              const meta = CROWD_META[lvl];
              const active = crowdLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCrowdLevel(lvl)}
                  style={{
                    padding: "6px 4px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: active ? `1px solid ${meta.color}` : `1px solid ${borderCol}`,
                    background: active ? `${meta.color}22` : cardBg,
                    color: active ? meta.color : textSecondary,
                  }}
                >
                  {meta.short}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleBoardConfirm}
            disabled={boardSource === "gps" && !gpsCoord}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              background: boardSource === "gps" && !gpsCoord ? "#475569" : "#10b981",
              color: "white",
              fontWeight: 700,
              fontSize: "13px",
              cursor: boardSource === "gps" && !gpsCoord ? "not-allowed" : "pointer",
            }}
          >
            I Boarded This Bus
          </button>
        </div>
      )}

      {/* ── Active Community Bus Spottings ───────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: textPrimary }}>
            Live Buses on Map ({spottings.length})
          </span>
          <span style={{ fontSize: "11px", color: textSecondary }}>
            {coinBalance} Coins
          </span>
        </div>

        {spottings.length === 0 ? (
          <div style={{ fontSize: "12px", color: textSecondary, padding: "10px", textAlign: "center" }}>
            No active bus reports right now. Tap &quot;I Boarded&quot; to share!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {spottings.map((spot) => {
              const crowd = CROWD_META[spot.crowdLevel];
              return (
                <button
                  key={spot._id}
                  type="button"
                  onClick={() => onFocusLocation(spot.lat, spot.lng)}
                  style={{
                    textAlign: "left",
                    padding: "9px 11px",
                    borderRadius: "10px",
                    background: subCardBg,
                    border: spot.isOwnSession
                      ? "1px solid #10b981"
                      : `1px solid ${borderCol}`,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        background: getRouteColor(spot.routeId),
                        color: "white",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "1px 7px",
                        borderRadius: "999px",
                      }}
                    >
                      {spot.routeId} {spot.isOwnSession ? "• YOU" : ""}
                    </span>
                    <span style={{ fontSize: "10px", color: textSecondary }}>
                      {formatTimeAgo(spot.spottedAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: textPrimary, marginTop: 5 }}>
                    {spot.stopName}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginTop: 3 }}>
                    <span style={{ color: crowd.color }}>{crowd.label}</span>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>Locate →</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface LiveTrackerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeBoarding: ActiveBoardingSession | null;
  spottings: LiveBusSpotting[];
  coinBalance: number;
  selectedOption: TransitOption | null;
  onFocusLocation: (lat: number, lng: number) => void;
  dark?: boolean;
}

export default function LiveTrackerSheet({
  open,
  onOpenChange,
  activeBoarding,
  spottings,
  coinBalance,
  selectedOption,
  onFocusLocation,
  dark = true,
}: LiveTrackerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showOverlay={false}
        className={`w-80 sm:w-96 p-0 flex flex-col ${
          dark ? "bg-slate-950 border-l border-slate-800 text-slate-100" : "bg-white text-slate-900"
        }`}
      >
        <SheetHeader className={`px-5 pt-5 pb-3 border-b ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <SheetTitle className={`text-base font-bold flex items-center gap-2 ${dark ? "text-slate-100" : "text-slate-900"}`}>
            Live Bus Tracker
          </SheetTitle>
          <SheetDescription className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Crowdsource real-time bus spots &amp; earn Commute Coins
          </SheetDescription>
        </SheetHeader>

        <LiveTrackerView
          activeBoarding={activeBoarding}
          spottings={spottings}
          coinBalance={coinBalance}
          selectedOption={selectedOption}
          onFocusLocation={onFocusLocation}
          dark={dark}
        />
      </SheetContent>
    </Sheet>
  );
}
