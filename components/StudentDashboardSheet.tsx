"use client";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getRouteColor } from "@/lib/routeColors";
import {
  computeDashboardMetrics,
  DashboardTimeframe,
} from "@/lib/commuteAnalytics";
import {
  CASHOUT_THRESHOLD_COINS,
  COIN_VALUE_PKR,
  CommuteTrip,
  formatTimeAgo,
  StudentProfile,
} from "@/lib/commuteTypes";

export interface StudentDashboardViewProps {
  profile: StudentProfile | null;
  trips: CommuteTrip[];
  onOpenRewards?: () => void;
  dark?: boolean;
}

const TIMEFRAME_OPTIONS: { id: DashboardTimeframe; label: string }[] = [
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
  { id: "all", label: "All Time" },
];

export function StudentDashboardView({
  profile,
  trips,
  onOpenRewards,
  dark = true,
}: StudentDashboardViewProps) {
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>("month");

  const metrics = useMemo(
    () => computeDashboardMetrics(trips, timeframe),
    [trips, timeframe]
  );

  const coinBalance = profile?.coinBalance ?? 0;
  const progressPct = Math.min(
    100,
    Math.round((coinBalance / CASHOUT_THRESHOLD_COINS) * 100)
  );
  const coinsRemaining = Math.max(0, CASHOUT_THRESHOLD_COINS - coinBalance);
  const cashValuePkr = Math.round(coinBalance * COIN_VALUE_PKR);
  const thresholdPkr = Math.round(CASHOUT_THRESHOLD_COINS * COIN_VALUE_PKR);

  const cardBg = dark ? "#0f172a" : "#f8fafc";
  const innerBg = dark ? "#1e293b" : "#ffffff";
  const borderCol = dark ? "#334155" : "#e2e8f0";
  const textPrimary = dark ? "#f8fafc" : "#0f172a";
  const textSecondary = dark ? "#94a3b8" : "#64748b";

  const kpiCards = [
    {
      label: "Money Spent",
      value: `Rs. ${metrics.totalFarePkr.toLocaleString()}`,
      sub: `${metrics.tripCount} verified bus ride${metrics.tripCount === 1 ? "" : "s"}`,
      accent: dark ? "#60a5fa" : "#2563eb",
    },
    {
      label: "Saved vs Ride-Hail",
      value: `Rs. ${metrics.totalSavingsPkr.toLocaleString()}`,
      sub: `vs Rs. ${metrics.totalRideHailPkr.toLocaleString()} ride-hail`,
      accent: dark ? "#34d399" : "#059669",
    },
    {
      label: "Bus Distance",
      value: `${metrics.totalBusKm.toFixed(2)} km`,
      sub: "Rapid & EV transit legs",
      accent: dark ? "#c084fc" : "#9333ea",
    },
    {
      label: "Walked",
      value: `${metrics.totalWalkKm.toFixed(2)} km`,
      sub: "First & last-mile steps",
      accent: dark ? "#38bdf8" : "#0284c7",
    },
  ];

  return (
    <div
      style={{
        overflowY: "auto",
        flex: 1,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* ── Timeframe Filter Pills ────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          padding: "4px",
          borderRadius: "10px",
          background: cardBg,
          border: `1px solid ${borderCol}`,
        }}
      >
        {TIMEFRAME_OPTIONS.map((opt) => {
          const active = timeframe === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTimeframe(opt.id)}
              style={{
                padding: "6px 8px",
                borderRadius: "7px",
                border: "none",
                background: active ? "#2563eb" : "transparent",
                color: active ? "white" : textSecondary,
                fontSize: "12px",
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Financial & Distance 2x2 Grid ─────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: "11px 12px",
              borderRadius: "11px",
              background: cardBg,
              border: `1px solid ${borderCol}`,
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: textSecondary,
                fontWeight: 600,
              }}
            >
              {kpi.label}
            </div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: kpi.accent,
                marginTop: 4,
              }}
            >
              {kpi.value}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: textSecondary,
                marginTop: 2,
              }}
            >
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Commute Rewards Widget (Coins + Cashout Progress) */}
      <div
        style={{
          padding: "13px",
          borderRadius: "12px",
          background: dark
            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(16, 185, 129, 0.08))"
            : "linear-gradient(135deg, #fffbeb, #ecfdf5)",
          border: dark ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid #fde68a",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: dark ? "#fbbf24" : "#b45309" }}>
              COMMUTE REWARDS BALANCE
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: textPrimary, marginTop: 2 }}>
              {coinBalance} Coins{" "}
              <span style={{ fontSize: "12px", fontWeight: 600, color: textSecondary }}>
                (≈ Rs. {cashValuePkr})
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: dark ? "#34d399" : "#047857",
              background: dark ? "rgba(16, 185, 129, 0.16)" : "#d1fae5",
              padding: "4px 9px",
              borderRadius: "999px",
            }}
          >
            {progressPct}%
          </div>
        </div>

        {/* Progress bar toward EasyPaisa threshold */}
        <div
          style={{
            marginTop: 10,
            height: "8px",
            borderRadius: "999px",
            background: dark ? "#1e293b" : "#e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              borderRadius: "999px",
              background: "linear-gradient(90deg, #f59e0b, #10b981)",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 7,
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: textSecondary,
          }}
        >
          <span>
            {coinsRemaining === 0
              ? `Ready to redeem Rs. ${thresholdPkr} via EasyPaisa!`
              : `${coinsRemaining} more coins for Rs. ${thresholdPkr} EasyPaisa cashout`}
          </span>
          <span style={{ fontWeight: 700 }}>
            {coinBalance}/{CASHOUT_THRESHOLD_COINS}
          </span>
        </div>

        {onOpenRewards && (
          <button
            type="button"
            onClick={onOpenRewards}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "7px 10px",
              borderRadius: "8px",
              border: dark
                ? "1px solid rgba(245, 158, 11, 0.4)"
                : "1px solid #f59e0b",
              background: dark ? "rgba(245, 158, 11, 0.16)" : "#fef3c7",
              color: dark ? "#fbbf24" : "#92400e",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Redeem Coins via EasyPaisa →
          </button>
        )}
      </div>

      {/* ── Carbon Footprint & Primary Line Card ────────────── */}
      <div
        style={{
          padding: "13px",
          borderRadius: "12px",
          background: cardBg,
          border: `1px solid ${borderCol}`,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: textSecondary }}>
              CARBON FOOTPRINT REDUCTION
            </div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: dark ? "#34d399" : "#059669", marginTop: 2 }}>
              {metrics.totalCo2SavedKg.toFixed(2)} kg CO₂ saved
            </div>
          </div>

          {metrics.primaryBusLine && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: textSecondary }}>
                PRIMARY LINE
              </div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 3,
                  background: getRouteColor(metrics.primaryBusLine.routeId),
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: "999px",
                }}
              >
                {metrics.primaryBusLine.routeId} ({metrics.primaryBusLine.sharePct}%)
              </span>
            </div>
          )}
        </div>

        {/* Route Breakdown Bars */}
        {metrics.routeBreakdown.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
            {metrics.routeBreakdown.map((rb) => (
              <div key={rb.routeId} style={{ fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: textPrimary }}>
                    {rb.routeId}
                  </span>
                  <span style={{ color: textSecondary }}>
                    {rb.count} ride{rb.count === 1 ? "" : "s"} • {rb.totalKm} km
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "999px",
                    background: innerBg,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${rb.sharePct}%`,
                      height: "100%",
                      background: getRouteColor(rb.routeId),
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Most Frequent Stops / Transit Hubs ──────────────── */}
      <div
        style={{
          padding: "13px",
          borderRadius: "12px",
          background: cardBg,
          border: `1px solid ${borderCol}`,
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: textSecondary, marginBottom: 8 }}>
          MOST FREQUENT STOPS &amp; HUBS
        </div>
        {metrics.topStops.length === 0 ? (
          <div style={{ fontSize: "12px", color: textSecondary }}>
            No trips in this timeframe yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {metrics.topStops.map((stop, idx) => (
              <div
                key={stop.stopName}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "7px 9px",
                  borderRadius: "8px",
                  background: innerBg,
                  fontSize: "12px",
                }}
              >
                <span style={{ color: textPrimary, fontWeight: 600 }}>
                  <span style={{ color: textSecondary, marginRight: 6 }}>#{idx + 1}</span>
                  {stop.stopName}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: dark ? "#38bdf8" : "#0284c7",
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {stop.visits} visit{stop.visits === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Trips Log ──────────────────────────────── */}
      <div
        style={{
          padding: "13px",
          borderRadius: "12px",
          background: cardBg,
          border: `1px solid ${borderCol}`,
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: textSecondary, marginBottom: 8 }}>
          RECENT VERIFIED COMMUTE TRIPS
        </div>
        {metrics.recentTrips.length === 0 ? (
          <div style={{ fontSize: "12px", color: textSecondary }}>
            No trips logged in this timeframe.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {metrics.recentTrips.slice(0, 5).map((trip) => (
              <div
                key={trip._id}
                style={{
                  padding: "9px 10px",
                  borderRadius: "9px",
                  background: innerBg,
                  border: `1px solid ${borderCol}`,
                  fontSize: "11px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      background: getRouteColor(trip.routeId),
                      color: "white",
                      fontWeight: 800,
                      fontSize: "10px",
                      padding: "1px 7px",
                      borderRadius: "999px",
                    }}
                  >
                    {trip.routeId}
                  </span>
                  <span style={{ color: dark ? "#34d399" : "#059669", fontWeight: 700 }}>
                    +{trip.coinsEarned} coins • Saved Rs. {trip.savingsPkr}
                  </span>
                </div>
                <div style={{ color: textPrimary, fontWeight: 600, marginTop: 4 }}>
                  {trip.boardStopName} ➔ {trip.alightStopName}
                </div>
                <div style={{ color: textSecondary, marginTop: 2 }}>
                  {trip.busDistanceKm} km bus • {trip.walkDistanceKm} km walk • {formatTimeAgo(trip.exitedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StudentDashboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile | null;
  trips: CommuteTrip[];
  onOpenRewards?: () => void;
  dark?: boolean;
}

export default function StudentDashboardSheet({
  open,
  onOpenChange,
  profile,
  trips,
  onOpenRewards,
  dark = true,
}: StudentDashboardSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showOverlay={false}
        className={`w-88 sm:w-[440px] sm:max-w-md p-0 flex flex-col ${
          dark
            ? "bg-slate-950 border-l border-slate-800 text-slate-100"
            : "bg-white text-slate-900"
        }`}
      >
        <SheetHeader
          className={`px-5 pt-5 pb-3 border-b ${
            dark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <SheetTitle
            className={`text-base font-bold flex items-center gap-2 ${
              dark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Student Commute Dashboard
          </SheetTitle>
          <SheetDescription
            className={`text-xs flex items-center gap-2 ${
              dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <span>{profile?.displayName ?? "Student Commuter"}</span>
            {profile?.verifiedStudent && (
              <span
                style={{
                  background: dark ? "rgba(16, 185, 129, 0.16)" : "#d1fae5",
                  color: dark ? "#34d399" : "#047857",
                  padding: "1px 6px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                ✓ Verified Student
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <StudentDashboardView
          profile={profile}
          trips={trips}
          onOpenRewards={() => {
            onOpenChange(false);
            onOpenRewards?.();
          }}
          dark={dark}
        />
      </SheetContent>
    </Sheet>
  );
}
