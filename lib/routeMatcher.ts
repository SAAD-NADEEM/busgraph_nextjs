/**
 * Multi-route and multi-hop transfer routing engine.
 *
 * Evaluates all loaded KML routes to find:
 * 1. Direct single-bus route options.
 * 2. Multi-bus transfer options (Bus 1 -> Transfer Hub -> Bus 2).
 */

import type { LatLng, SnapResult } from "./haversine";
import { snapToRoute, snapToRouteAfter, haversineDistance } from "./haversine";
import { loadAllRoutes, ParsedRoute } from "./kmlParser";
import { resolveStopName } from "./stopResolver";

export interface SingleLeg {
  routeId: string;
  routeName: string;
  direction: string;
  boardPoint: LatLng;
  alightPoint: LatLng;
  boardStopName: string;
  alightStopName: string;
  busPath: [number, number][];
  rideDistanceM: number;
  isTerminalStart?: boolean;
  isTerminalEnd?: boolean;
}

export interface TransitOption {
  id: string;
  type: "direct" | "transfer";
  summary: string;
  legs: SingleLeg[];
  /** Walking from origin to first boarding point */
  walkToStart: { from: LatLng; to: LatLng; distanceM: number; stopName: string };
  /** Walking transfers between buses (empty for direct) */
  transfers: { from: LatLng; to: LatLng; distanceM: number; fromStopName: string; toStopName: string }[];
  /** Walking from last alighting point to destination */
  walkFromEnd: { from: LatLng; to: LatLng; distanceM: number; stopName: string };
  /** Total walking distance in meters */
  totalWalkDistanceM: number;
  /** Total bus ride distance in meters */
  totalBusDistanceM: number;
  /** Composite score for ranking options (lower is better) */
  score: number;
  /** Flagged if walking exceeds bus ride distance */
  isHighWalk?: boolean;
  /** Flagged if either first-mile or last-mile gap is > 1.8km (Rickshaw / Chingchi feeder recommended) */
  needsFeeder?: boolean;
}

const MAX_DIRECT_WALK_M = 4_500; // 4.5km maximum first/last-mile gap to direct route
const MAX_ORIGIN_TRANSFER_SNAP_M = 4_500; // 4.5km maximum first-mile gap to start first bus
const MAX_DEST_TRANSFER_SNAP_M = 4_500; // 4.5km maximum last-mile gap from last bus to destination
const MAX_TRANSFER_WALK_M = 1_200; // 1.2km maximum walk between transfer stops
const FEEDER_THRESHOLD_M = 1_800; // > 1.8km non-bus gap is treated as a Rickshaw/Feeder leg

function calcBusDistance(coords: [number, number][]): number {
  let dist = 0;
  for (let i = 1; i < coords.length; i++) {
    dist += haversineDistance(
      { lat: coords[i - 1][1], lng: coords[i - 1][0] },
      { lat: coords[i][1], lng: coords[i][0] }
    );
  }
  return dist;
}

interface RouteVariant {
  routeId: string;
  routeName: string;
  direction: string;
  coordinates: LatLng[];
}

function getVariants(allRoutes: ParsedRoute[]): RouteVariant[] {
  const list: RouteVariant[] = [];
  for (const route of allRoutes) {
    list.push({
      routeId: route.routeId,
      routeName: route.name,
      direction: route.direction,
      coordinates: route.coordinates,
    });
    list.push({
      routeId: route.routeId,
      routeName: route.name,
      direction: route.direction.replace(/_UP$/, "_DOWN").replace(/_DOWN$/, "_UP"),
      coordinates: [...route.coordinates].reverse(),
    });
  }
  return list;
}

/**
 * Finds both direct and multi-bus transfer routes between origin and destination.
 */
export async function findRouteOptions(
  origin: LatLng,
  destination: LatLng
): Promise<TransitOption[]> {
  const allRoutes = await loadAllRoutes();
  const variants = getVariants(allRoutes);

  const directOptions: TransitOption[] = [];
  const transferOptions: TransitOption[] = [];

  // ── 1. Find Direct Routes ───────────────────────────────────────────
  for (const v of variants) {
    const startNode = snapToRoute(origin, v.coordinates);
    if (startNode.index >= v.coordinates.length - 1) continue;

    const endNode = snapToRouteAfter(destination, v.coordinates, startNode.index);

    if (
      startNode.distance > MAX_DIRECT_WALK_M ||
      endNode.distance > MAX_DIRECT_WALK_M
    ) {
      continue;
    }

    const busCoords: [number, number][] = v.coordinates
      .slice(startNode.index, endNode.index + 1)
      .map((c) => [c.lng, c.lat]);

    const rideDist = calcBusDistance(busCoords);
    if (rideDist < 100) continue;

    const isTerminalStart = startNode.index <= 5;
    const isTerminalEnd = endNode.index >= v.coordinates.length - 6;

    const totalWalk = startNode.distance + endNode.distance;
    const isHighWalk = totalWalk > rideDist;
    const needsFeeder = startNode.distance > FEEDER_THRESHOLD_M || endNode.distance > FEEDER_THRESHOLD_M;
    const score = totalWalk * 3.0 + rideDist * 0.4 + (isHighWalk ? 2500 : 0);

    directOptions.push({
      id: `direct-${v.routeId}-${v.direction}`,
      type: "direct",
      summary: `Direct via ${v.routeId}`,
      legs: [
        {
          routeId: v.routeId,
          routeName: v.routeName,
          direction: v.direction,
          boardPoint: startNode.point,
          alightPoint: endNode.point,
          boardStopName: "",
          alightStopName: "",
          busPath: busCoords,
          rideDistanceM: rideDist,
          isTerminalStart,
          isTerminalEnd,
        },
      ],
      walkToStart: {
        from: origin,
        to: startNode.point,
        distanceM: startNode.distance,
        stopName: "",
      },
      transfers: [],
      walkFromEnd: {
        from: endNode.point,
        to: destination,
        distanceM: endNode.distance,
        stopName: "",
      },
      totalWalkDistanceM: totalWalk,
      totalBusDistanceM: rideDist,
      score,
      isHighWalk,
      needsFeeder,
    });
  }

  // Deduplicate direct routes by routeId keeping the best score
  const uniqueDirectMap = new Map<string, TransitOption>();
  for (const opt of directOptions) {
    const key = opt.legs[0].routeId;
    if (!uniqueDirectMap.has(key) || opt.score < uniqueDirectMap.get(key)!.score) {
      uniqueDirectMap.set(key, opt);
    }
  }
  const filteredDirect = Array.from(uniqueDirectMap.values()).sort(
    (a, b) => a.score - b.score
  );

  // ── 2. Find Multi-Hop Transfer Routes (Bus A -> Bus B) ─────────────
  const originCandidates: { variant: RouteVariant; boardNode: SnapResult }[] = [];
  const destCandidates: { variant: RouteVariant; alightNode: SnapResult }[] = [];

  for (const v of variants) {
    const startNode = snapToRoute(origin, v.coordinates);
    if (startNode.distance <= MAX_ORIGIN_TRANSFER_SNAP_M && startNode.index < v.coordinates.length - 2) {
      originCandidates.push({ variant: v, boardNode: startNode });
    }

    const endNode = snapToRoute(destination, v.coordinates);
    if (endNode.distance <= MAX_DEST_TRANSFER_SNAP_M && endNode.index > 1) {
      destCandidates.push({ variant: v, alightNode: endNode });
    }
  }

  for (const orig of originCandidates) {
    for (const dest of destCandidates) {
      if (orig.variant.routeId === dest.variant.routeId) continue;

      let bestTransferDist = Infinity;
      let bestOrigTransferIdx = -1;
      let bestDestTransferIdx = -1;

      // Sample along routes for performance
      const step1 = Math.max(1, Math.floor((orig.variant.coordinates.length - orig.boardNode.index) / 40));
      const step2 = Math.max(1, Math.floor(dest.alightNode.index / 40));

      for (let i = orig.boardNode.index + 2; i < orig.variant.coordinates.length; i += step1) {
        const pt1 = orig.variant.coordinates[i];
        for (let j = 1; j < dest.alightNode.index; j += step2) {
          const pt2 = dest.variant.coordinates[j];
          const dist = haversineDistance(pt1, pt2);
          if (dist < bestTransferDist) {
            bestTransferDist = dist;
            bestOrigTransferIdx = i;
            bestDestTransferIdx = j;
          }
        }
      }

      if (
        bestTransferDist <= MAX_TRANSFER_WALK_M &&
        bestOrigTransferIdx > orig.boardNode.index &&
        bestDestTransferIdx < dest.alightNode.index
      ) {
        const leg1Coords: [number, number][] = orig.variant.coordinates
          .slice(orig.boardNode.index, bestOrigTransferIdx + 1)
          .map((c) => [c.lng, c.lat]);

        const leg2Coords: [number, number][] = dest.variant.coordinates
          .slice(bestDestTransferIdx, dest.alightNode.index + 1)
          .map((c) => [c.lng, c.lat]);

        const ride1 = calcBusDistance(leg1Coords);
        const ride2 = calcBusDistance(leg2Coords);
        if (ride1 < 300 || ride2 < 300) continue;

        const isTerminalStart1 = orig.boardNode.index <= 5;
        const isTerminalEnd1 = bestOrigTransferIdx >= orig.variant.coordinates.length - 6;
        const isTerminalStart2 = bestDestTransferIdx <= 5;
        const isTerminalEnd2 = dest.alightNode.index >= dest.variant.coordinates.length - 6;

        const totalWalk =
          orig.boardNode.distance + bestTransferDist + dest.alightNode.distance;
        const totalRide = ride1 + ride2;

        const isHighWalk = totalWalk > totalRide;
        const needsFeeder =
          orig.boardNode.distance > FEEDER_THRESHOLD_M ||
          dest.alightNode.distance > FEEDER_THRESHOLD_M;
        const score = totalWalk * 3.0 + totalRide * 0.4 + 450 + (isHighWalk ? 2500 : 0);

        transferOptions.push({
          id: `transfer-${orig.variant.routeId}-${dest.variant.routeId}`,
          type: "transfer",
          summary: `Transfer: ${orig.variant.routeId} ➔ ${dest.variant.routeId}`,
          legs: [
            {
              routeId: orig.variant.routeId,
              routeName: orig.variant.routeName,
              direction: orig.variant.direction,
              boardPoint: orig.boardNode.point,
              alightPoint: orig.variant.coordinates[bestOrigTransferIdx],
              boardStopName: "",
              alightStopName: "",
              busPath: leg1Coords,
              rideDistanceM: ride1,
              isTerminalStart: isTerminalStart1,
              isTerminalEnd: isTerminalEnd1,
            },
            {
              routeId: dest.variant.routeId,
              routeName: dest.variant.routeName,
              direction: dest.variant.direction,
              boardPoint: dest.variant.coordinates[bestDestTransferIdx],
              alightPoint: dest.alightNode.point,
              boardStopName: "",
              alightStopName: "",
              busPath: leg2Coords,
              rideDistanceM: ride2,
              isTerminalStart: isTerminalStart2,
              isTerminalEnd: isTerminalEnd2,
            },
          ],
          walkToStart: {
            from: origin,
            to: orig.boardNode.point,
            distanceM: orig.boardNode.distance,
            stopName: "",
          },
          transfers: [
            {
              from: orig.variant.coordinates[bestOrigTransferIdx],
              to: dest.variant.coordinates[bestDestTransferIdx],
              distanceM: bestTransferDist,
              fromStopName: "",
              toStopName: "",
            },
          ],
          walkFromEnd: {
            from: dest.alightNode.point,
            to: destination,
            distanceM: dest.alightNode.distance,
            stopName: "",
          },
          totalWalkDistanceM: totalWalk,
          totalBusDistanceM: totalRide,
          score,
          isHighWalk,
          needsFeeder,
        });
      }
    }
  }

  // Deduplicate transfer combinations by route pair
  const uniqueTransferMap = new Map<string, TransitOption>();
  for (const opt of transferOptions) {
    const key = `${opt.legs[0].routeId}->${opt.legs[1].routeId}`;
    if (!uniqueTransferMap.has(key) || opt.score < uniqueTransferMap.get(key)!.score) {
      uniqueTransferMap.set(key, opt);
    }
  }

  // Combine all deduplicated direct and transfer options into a unified pool
  const allCandidates: TransitOption[] = [
    ...uniqueDirectMap.values(),
    ...uniqueTransferMap.values(),
  ];

  // Sort by transit score (lowest physical effort / optimal transit utility first)
  allCandidates.sort((a, b) => a.score - b.score);

  // Take the top 5 overall options
  const combined: TransitOption[] = allCandidates.slice(0, 5);

  // Guarantee the best single-bus direct option is also visible (if one exists and isn't already in top 5)
  const hasDirect = combined.some((o) => o.type === "direct");
  if (!hasDirect) {
    const bestDirect = allCandidates.find((o) => o.type === "direct");
    if (bestDirect) {
      combined.push(bestDirect);
    }
  }

  // Resolve human-readable stop names for the selected options
  for (const opt of combined) {
    for (let i = 0; i < opt.legs.length; i++) {
      const leg = opt.legs[i];
      leg.boardStopName = await resolveStopName(
        leg.boardPoint,
        leg.routeName,
        !!leg.isTerminalStart,
        false
      );
      leg.alightStopName = await resolveStopName(
        leg.alightPoint,
        leg.routeName,
        false,
        !!leg.isTerminalEnd
      );
    }

    opt.walkToStart.stopName = opt.legs[0].boardStopName;
    opt.walkFromEnd.stopName = opt.legs[opt.legs.length - 1].alightStopName;

    for (let i = 0; i < opt.transfers.length; i++) {
      opt.transfers[i].fromStopName = opt.legs[i].alightStopName;
      opt.transfers[i].toStopName = opt.legs[i + 1].boardStopName;
    }
  }

  return combined;
}

/**
 * Backward compatibility helper for single route match queries.
 */
export async function findBestRoute(origin: LatLng, destination: LatLng) {
  const options = await findRouteOptions(origin, destination);
  if (options.length === 0) return null;
  const best = options[0];

  return {
    routeId: best.legs[0].routeId,
    routeName: best.legs[0].routeName,
    direction: best.legs[0].direction,
    startNode: {
      point: best.legs[0].boardPoint,
      index: 0,
      distance: best.walkToStart.distanceM,
    },
    endNode: {
      point: best.legs[best.legs.length - 1].alightPoint,
      index: 0,
      distance: best.walkFromEnd.distanceM,
    },
    busPath: best.legs[0].busPath,
    walkToStart: best.walkToStart,
    walkFromEnd: best.walkFromEnd,
    totalSnapDistance: best.totalWalkDistanceM,
    allOptions: options,
  };
}
