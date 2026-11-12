/**
 * Shared domain models structured around Sanity Studio document conventions.
 *
 * Every entity carries `_id`, `_type`, and `_createdAt` so the local demo
 * adapter can be swapped for `@sanity/client` GROQ queries and Sanity mutations
 * without changing component contracts.
 */

import { ROUTE_COLORS } from "./routeColors";

export const AVAILABLE_ROUTE_IDS = Object.keys(ROUTE_COLORS);

/** PBS tiered flat fares: Rs. 80 under 15 km, Rs. 120 for full 15+ km route */
export const BUS_FARE_SHORT_PKR = 80;
export const BUS_FARE_FULL_PKR = 120;
export const BUS_FARE_TIER_THRESHOLD_KM = 15;
export const COINS_PER_VERIFIED_RIDE = 15;
export const COINS_PER_HELPFUL_ALERT = 5;
export const CASHOUT_THRESHOLD_COINS = 200;
/** 200 coins = Rs. 100 EasyPaisa payout (0.50 PKR per coin) */
export const COIN_VALUE_PKR = 0.5;

/** Calculates PBS ticket fare based on trip distance in kilometers. */
export function calculateBusFarePkr(distanceKm: number): number {
  return distanceKm < BUS_FARE_TIER_THRESHOLD_KM
    ? BUS_FARE_SHORT_PKR
    : BUS_FARE_FULL_PKR;
}
/** How long a student-spotted bus stays active on the live map (25 minutes) */
export const LIVE_SPOTTING_TTL_MS = 25 * 60 * 1000;

export type CrowdLevel = "seats" | "standing" | "crowded";
export type ChatTagType = "crossed" | "crowd" | "delay" | "free";
export type CoinTransactionKind = "earn_ride" | "earn_alert" | "redeem_easypaisa";

export interface SanityDocumentBase {
  _id: string;
  _type: string;
  _createdAt: string;
}

/** Sanity schema: `studentProfile` */
export interface StudentProfile extends SanityDocumentBase {
  _type: "studentProfile";
  studentId: string;
  displayName: string;
  university: string;
  verifiedStudent: boolean;
  coinBalance: number;
  lifetimeCoinsEarned: number;
  easypaisaNumber: string;
}

/** Sanity schema: `liveBusSpotting` */
export interface LiveBusSpotting extends SanityDocumentBase {
  _type: "liveBusSpotting";
  routeId: string;
  stopName: string;
  lat: number;
  lng: number;
  crowdLevel: CrowdLevel;
  reportedBy: string;
  verifiedStudent: boolean;
  spottedAt: string;
  expiresAt: string;
  status: "active" | "completed";
  isOwnSession?: boolean;
}

/** Client-side in-progress ride between tapping "I Boarded" and "I Exited" */
export interface ActiveBoardingSession {
  spottingId: string;
  routeId: string;
  boardStopName: string;
  boardLat: number;
  boardLng: number;
  boardedAt: string;
  crowdLevel: CrowdLevel;
  plannedAlightStopName?: string;
  plannedAlightLat?: number;
  plannedAlightLng?: number;
  plannedBusDistanceM?: number;
  plannedWalkDistanceM?: number;
}

/** Sanity schema: `commuteTrip` */
export interface CommuteTrip extends SanityDocumentBase {
  _type: "commuteTrip";
  studentId: string;
  routeId: string;
  boardStopName: string;
  alightStopName: string;
  busDistanceKm: number;
  walkDistanceKm: number;
  durationMinutes: number;
  farePkr: number;
  rideHailEstimatePkr: number;
  savingsPkr: number;
  co2SavedKg: number;
  coinsEarned: number;
  boardedAt: string;
  exitedAt: string;
}

/** Sanity schema: `coinTransaction` */
export interface CoinTransaction extends SanityDocumentBase {
  _type: "coinTransaction";
  studentId: string;
  kind: CoinTransactionKind;
  coinsDelta: number;
  pkrAmount?: number;
  description: string;
  referenceAccount?: string;
  createdAt: string;
}

/** Sanity schema: `routeChatMessage` */
export interface RouteChatMessage extends SanityDocumentBase {
  _type: "routeChatMessage";
  routeId: string;
  studentId: string;
  senderName: string;
  verifiedStudent: boolean;
  tagType: ChatTagType;
  message: string;
  createdAt: string;
}

export interface CommuteDemoState {
  version: number;
  profile: StudentProfile;
  activeBoarding: ActiveBoardingSession | null;
  spottings: LiveBusSpotting[];
  trips: CommuteTrip[];
  transactions: CoinTransaction[];
  chatMessages: RouteChatMessage[];
}

export interface BoardBusInput {
  routeId: string;
  boardStopName: string;
  boardLat: number;
  boardLng: number;
  crowdLevel: CrowdLevel;
  plannedAlightStopName?: string;
  plannedAlightLat?: number;
  plannedAlightLng?: number;
  plannedBusDistanceM?: number;
  plannedWalkDistanceM?: number;
}

export interface ExitBusInput {
  alightStopName: string;
  alightLat: number;
  alightLng: number;
  walkDistanceKmOverride?: number;
}

export interface ExitBusResult {
  trip: CommuteTrip;
  coinsEarned: number;
  newBalance: number;
}

export interface RedeemRewardsInput {
  coinsToRedeem: number;
  easypaisaNumber: string;
  accountTitle?: string;
}

export interface RedeemRewardsResult {
  transaction: CoinTransaction;
  receiptRef: string;
  pkrAmount: number;
  newBalance: number;
}

export interface PostChatMessageInput {
  routeId: string;
  tagType: ChatTagType;
  message: string;
}

export interface PostChatMessageResult {
  entry: RouteChatMessage;
  coinsAwarded: number;
  newBalance: number;
}

export const CHAT_TAG_META: Record<
  ChatTagType,
  { label: string; color: string; bgDark: string; bgLight: string }
> = {
  crossed: {
    label: "Stop Alert",
    color: "#38bdf8",
    bgDark: "rgba(56, 189, 248, 0.14)",
    bgLight: "#e0f2fe",
  },
  crowd: {
    label: "Crowd Info",
    color: "#10b981",
    bgDark: "rgba(16, 185, 129, 0.14)",
    bgLight: "#d1fae5",
  },
  delay: {
    label: "Traffic Delay",
    color: "#f59e0b",
    bgDark: "rgba(245, 158, 11, 0.14)",
    bgLight: "#fef3c7",
  },
  free: {
    label: "Student Chat",
    color: "#a78bfa",
    bgDark: "rgba(167, 139, 250, 0.14)",
    bgLight: "#ede9fe",
  },
};

export const CROWD_META: Record<
  CrowdLevel,
  { label: string; short: string; emoji: string; color: string }
> = {
  seats: { label: "Seats Available", short: "Seats", emoji: "💺", color: "#10b981" },
  standing: { label: "Standing Only", short: "Standing", emoji: "🧍", color: "#f59e0b" },
  crowded: { label: "Crowded", short: "Crowded", emoji: "👥", color: "#ef4444" },
};

/** Formats an ISO timestamp into compact relative time for live bus badges. */
export function formatTimeAgo(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 45) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

