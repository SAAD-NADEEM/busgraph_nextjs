"use client";
import { Marker } from "react-map-gl/mapbox";

export interface MarkerPoint {
  lat: number;
  lng: number;
  label: string;
  type: "origin" | "destination" | "board" | "alight" | "transfer";
  badge?: string;
}

interface SnapMarkersProps {
  markers: MarkerPoint[];
}

export default function SnapMarkers({ markers }: SnapMarkersProps) {
  return (
    <>
      {markers.map((m, idx) => {
        let bg = "#1a73e8";
        let icon = "📍";
        let size = 16;

        if (m.type === "origin") {
          bg = "#1a73e8";
          icon = "🟢";
          size = 18;
        } else if (m.type === "destination") {
          bg = "#EA4335";
          icon = "🏁";
          size = 18;
        } else if (m.type === "board") {
          bg = "#0F9D58";
          icon = "🚌";
          size = 20;
        } else if (m.type === "alight") {
          bg = "#FBBC04";
          icon = "🚏";
          size = 20;
        } else if (m.type === "transfer") {
          bg = "#9333ea";
          icon = "🔄";
          size = 22;
        }

        return (
          <Marker
            key={`${m.type}-${idx}-${m.lat}-${m.lng}`}
            longitude={m.lng}
            latitude={m.lat}
            anchor="center"
          >
            <div
              title={m.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: bg,
                  border: "2px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: size * 0.55,
                }}
              >
                {icon}
              </div>
              {m.badge && (
                <span
                  style={{
                    marginTop: 2,
                    background: "rgba(0,0,0,0.75)",
                    color: "white",
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.badge}
                </span>
              )}
            </div>
          </Marker>
        );
      })}
    </>
  );
}
