/**
 * Pure analytics helpers for the Student Commute Dashboard (Step 2).
 * Aggregates trip logs by timeframe cleanly for UI rendering and Sanity GROQ parity.
 */

import type { CommuteTrip } from "./commuteTypes";

export type DashboardTimeframe = "month" | "year" | "all";

export interface RouteUsageStat {
  routeId: string;
  count: number;
  totalKm: number;
  sharePct: number;
}

export interface StopFrequencyStat {
  stopName: string;
  visits: number;
}

export interface DashboardMetrics {
  tripCount: number;
  totalFarePkr: number;
  totalRideHailPkr: number;
  totalSavingsPkr: number;
  totalBusKm: number;
  totalWalkKm: number;
  totalCo2SavedKg: number;
  primaryBusLine: RouteUsageStat | null;
  routeBreakdown: RouteUsageStat[];
  topStops: StopFrequencyStat[];
  recentTrips: CommuteTrip[];
}

const DAY_MS = 86_400_000;

/**
 * Filters trips by timeframe (`month` = last 30d, `year` = last 365d, `all` = all records).
 */
export function filterTripsByTimeframe(
  trips: CommuteTrip[],
  timeframe: DashboardTimeframe,
  nowMs: number = Date.now()
): CommuteTrip[] {
  if (timeframe === "all") return trips;
  const windowDays = timeframe === "month" ? 30 : 365;
  const cutoffMs = nowMs - windowDays * DAY_MS;
  return trips.filter((t) => new Date(t.exitedAt).getTime() >= cutoffMs);
}

/**
 * Computes financial, distance, sustainability, and habit stats from trip records.
 */
export function computeDashboardMetrics(
  trips: CommuteTrip[],
  timeframe: DashboardTimeframe
): DashboardMetrics {
  const filtered = filterTripsByTimeframe(trips, timeframe).sort(
    (a, b) => new Date(b.exitedAt).getTime() - new Date(a.exitedAt).getTime()
  );

  let totalFarePkr = 0;
  let totalRideHailPkr = 0;
  let totalSavingsPkr = 0;
  let totalBusKm = 0;
  let totalWalkKm = 0;
  let totalCo2SavedKg = 0;

  const routeMap = new Map<string, { count: number; totalKm: number }>();
  const stopMap = new Map<string, number>();

  for (const trip of filtered) {
    totalFarePkr += trip.farePkr;
    totalRideHailPkr += trip.rideHailEstimatePkr;
    totalSavingsPkr += trip.savingsPkr;
    totalBusKm += trip.busDistanceKm;
    totalWalkKm += trip.walkDistanceKm;
    totalCo2SavedKg += trip.co2SavedKg;

    const rStat = routeMap.get(trip.routeId) ?? { count: 0, totalKm: 0 };
    rStat.count += 1;
    rStat.totalKm += trip.busDistanceKm;
    routeMap.set(trip.routeId, rStat);

    stopMap.set(trip.boardStopName, (stopMap.get(trip.boardStopName) ?? 0) + 1);
    stopMap.set(trip.alightStopName, (stopMap.get(trip.alightStopName) ?? 0) + 1);
  }

  const tripCount = filtered.length;
  const routeBreakdown: RouteUsageStat[] = Array.from(routeMap.entries())
    .map(([routeId, stat]) => ({
      routeId,
      count: stat.count,
      totalKm: Number(stat.totalKm.toFixed(2)),
      sharePct: tripCount > 0 ? Math.round((stat.count / tripCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || b.totalKm - a.totalKm);

  const topStops: StopFrequencyStat[] = Array.from(stopMap.entries())
    .map(([stopName, visits]) => ({ stopName, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 4);

  return {
    tripCount,
    totalFarePkr,
    totalRideHailPkr,
    totalSavingsPkr,
    totalBusKm: Number(totalBusKm.toFixed(2)),
    totalWalkKm: Number(totalWalkKm.toFixed(2)),
    totalCo2SavedKg: Number(totalCo2SavedKg.toFixed(2)),
    primaryBusLine: routeBreakdown[0] ?? null,
    routeBreakdown,
    topStops,
    recentTrips: filtered.slice(0, 5),
  };
}

