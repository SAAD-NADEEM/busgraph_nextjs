"use client";
import { useState } from "react";
import { Marker } from "react-map-gl/mapbox";
import { getRouteColor } from "@/lib/routeColors";
import { CROWD_META, formatTimeAgo, LiveBusSpotting } from "@/lib/commuteTypes";

interface LiveBusMarkersProps {
  spottings: LiveBusSpotting[];
  dark?: boolean;
}

/**
 * Renders crowdsourced live bus spottings on the Mapbox map.
 * Each marker uses its official PBS route color, a live ping ring,
 * and an expandable tooltip showing crowd status and reporter info.
 */
export default function LiveBusMarkers({ spottings, dark = true }: LiveBusMarkersProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      {spottings.map((spot) => {
        const routeColor = getRouteColor(spot.routeId);
        const crowd = CROWD_META[spot.crowdLevel];
        const isOpen = selectedId === spot._id;

        return (
          <Marker
            key={spot._id}
            longitude={spot.lng}
            latitude={spot.lat}
            anchor="center"
            style={{ zIndex: isOpen ? 15 : spot.isOwnSession ? 10 : 5 }}
          >
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Interactive detail popover above the live bus marker */}
              {isOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    bottom: "42px",
                    width: "215px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: dark ? "rgba(15, 23, 42, 0.96)" : "rgba(255, 255, 255, 0.97)",
                    border: `1px solid ${dark ? "#334155" : "#cbd5e1"}`,
                    color: dark ? "#f8fafc" : "#0f172a",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                    fontSize: "12px",
                    zIndex: 20,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span
                      style={{
                        background: routeColor,
                        color: "white",
                        fontWeight: 800,
                        fontSize: "11px",
                        padding: "2px 7px",
                        borderRadius: "999px",
                      }}
                    >
                      {spot.routeId} Live
                    </span>
                    <button
                      onClick={() => setSelectedId(null)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: dark ? "#94a3b8" : "#64748b",
                        cursor: "pointer",
                        fontSize: "13px",
                        padding: "0 2px",
                      }}
                      aria-label="Close bus details"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>
                    {spot.stopName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "11px", marginBottom: 4 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: crowd.color,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ color: crowd.color, fontWeight: 600 }}>{crowd.label}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      color: dark ? "#94a3b8" : "#64748b",
                      borderTop: dark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                      paddingTop: 5,
                    }}
                  >
                    <span>
                      {spot.verifiedStudent ? "✓ " : ""}
                      {spot.reportedBy}
                    </span>
                    <span>{formatTimeAgo(spot.spottedAt)}</span>
                  </div>
                </div>
              )}

              {/* Pulsing ring + Bus Pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(isOpen ? null : spot._id);
                }}
                title={`${spot.routeId} spotted at ${spot.stopName} (${formatTimeAgo(spot.spottedAt)})`}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background: routeColor,
                  color: "white",
                  border: spot.isOwnSession ? "2px solid #4ade80" : "2px solid white",
                  boxShadow: spot.isOwnSession
                    ? "0 0 0 3px rgba(74, 222, 128, 0.35), 0 4px 12px rgba(0,0,0,0.45)"
                    : "0 4px 12px rgba(0,0,0,0.45)",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  className="animate-ping"
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "999px",
                    background: routeColor,
                    opacity: 0.35,
                    pointerEvents: "none",
                  }}
                />
                <span style={{ position: "relative" }}>{spot.routeId}</span>
                {spot.isOwnSession && (
                  <span
                    style={{
                      position: "relative",
                      fontSize: "9px",
                      background: "rgba(0,0,0,0.35)",
                      padding: "1px 4px",
                      borderRadius: "4px",
                    }}
                  >
                    YOU
                  </span>
                )}
              </button>
            </div>
          </Marker>
        );
      })}
    </>
  );
}

