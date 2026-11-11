"use client";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { RouteData } from "@/components/AllRoutesLayer";
import { getRouteColor } from "@/lib/routeColors";

interface RouteLegendSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All routes fetched from the API */
  routes: RouteData[];
  /** Currently loading */
  loading: boolean;
  /** Controlled set of visible route IDs */
  visibleRouteIds: Set<string>;
  /** Called when the user toggles a route checkbox */
  onToggleRoute: (routeId: string, checked: boolean) => void;
  dark?: boolean;
}

/**
 * Left-side sheet acting as the map legend.
 * Lists every bus route with its color swatch and a per-route checkbox.
 */
export default function RouteLegendSheet({
  open,
  onOpenChange,
  routes,
  loading,
  visibleRouteIds,
  onToggleRoute,
  dark = true,
}: RouteLegendSheetProps) {
  // Deduplicate routes by routeId so each bus only appears once
  const uniqueRoutes = Array.from(
    new Map(routes.map((r) => [r.routeId.split("_")[0], r])).values()
  );

  const allChecked =
    uniqueRoutes.length > 0 &&
    uniqueRoutes.every((r) => visibleRouteIds.has(r.routeId));

  const handleToggleAll = (checked: boolean) => {
    uniqueRoutes.forEach((r) => onToggleRoute(r.routeId, checked));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showOverlay={false}
        className={`w-72 max-w-xs p-0 flex flex-col ${
          dark ? "bg-slate-900 border-l border-slate-800 text-slate-100" : "bg-white"
        }`}
      >
        <SheetHeader
          className={`px-5 pt-5 pb-3 border-b ${
            dark ? "border-slate-800" : "border-gray-100"
          }`}
        >
          <SheetTitle
            className={`text-base font-semibold flex items-center gap-2 ${
              dark ? "text-slate-100" : "text-gray-800"
            }`}
          >
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#1a73e8,#0f9d58)",
                flexShrink: 0,
              }}
            />
            Map Legend
          </SheetTitle>
          <SheetDescription className={`text-xs ${dark ? "text-slate-400" : "text-gray-500"}`}>
            Toggle bus routes visible on the map
          </SheetDescription>
        </SheetHeader>

        {/* Select all */}
        {uniqueRoutes.length > 0 && (
          <div
            style={{
              padding: "10px 20px",
              borderBottom: dark ? "1px solid #1e293b" : "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              id="legend-select-all"
              type="checkbox"
              checked={allChecked}
              onChange={(e) => handleToggleAll(e.target.checked)}
              style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1a73e8" }}
            />
            <label
              htmlFor="legend-select-all"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: dark ? "#e2e8f0" : "#374151",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {allChecked ? "Hide all" : "Show all"} routes
            </label>
          </div>
        )}

        {/* Route list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {loading && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: dark ? "#64748b" : "#9ca3af",
                fontSize: 13,
              }}
            >
              Loading routes…
            </div>
          )}

          {!loading && uniqueRoutes.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: dark ? "#64748b" : "#9ca3af",
                fontSize: 13,
              }}
            >
              No routes loaded yet.
            </div>
          )}

          {uniqueRoutes.map((route) => {
            const color = getRouteColor(route.routeId);
            const label =
              route.name.match(/\((.+)\)/)?.[1] || route.name;
            const baseId = route.routeId.split("_")[0];
            const checked = visibleRouteIds.has(route.routeId);
            const checkboxId = `legend-route-${route.routeId}`;

            return (
              <label
                key={route.routeId}
                htmlFor={checkboxId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 20px",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background 0.15s",
                  background: checked ? `${color}22` : "transparent",
                  borderLeft: checked ? `3px solid ${color}` : "3px solid transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = `${color}2a`)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = checked ? `${color}22` : "transparent")
                }
              >
                {/* Color swatch */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: dark
                      ? `0 0 0 2px #0f172a, 0 0 0 3px ${color}`
                      : `0 0 0 2px white, 0 0 0 3px ${color}`,
                  }}
                />

                {/* Route label */}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color,
                      marginRight: 5,
                    }}
                  >
                    {baseId}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: dark ? "#cbd5e1" : "#374151",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "inline-block",
                      maxWidth: "calc(100% - 36px)",
                      verticalAlign: "middle",
                    }}
                  >
                    {label}
                  </span>
                </span>

                {/* Checkbox — visually on right */}
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onToggleRoute(route.routeId, e.target.checked)}
                  style={{
                    flexShrink: 0,
                    width: 15,
                    height: 15,
                    cursor: "pointer",
                    accentColor: color,
                  }}
                />
              </label>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
