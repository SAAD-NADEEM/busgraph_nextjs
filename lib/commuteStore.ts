/**
 * Sanity-ready client repository for BusGraph student commute data.
 *
 * Currently persists to `localStorage` with realistic Karachi demo seeds so the
 * app works zero-config offline. Every method mirrors a Sanity GROQ / mutation
 * boundary so migrating to `@sanity/client` only requires replacing this file.
 */

import { haversineDistance } from "./haversine";
import {
  ActiveBoardingSession,
  BoardBusInput,
  calculateBusFarePkr,
  CASHOUT_THRESHOLD_COINS,
  COIN_VALUE_PKR,
  COINS_PER_HELPFUL_ALERT,
  COINS_PER_VERIFIED_RIDE,
  CommuteDemoState,
  CommuteTrip,
  CrowdLevel,
  ExitBusInput,
  ExitBusResult,
  LIVE_SPOTTING_TTL_MS,
  LiveBusSpotting,
  PostChatMessageInput,
  PostChatMessageResult,
  RedeemRewardsInput,
  RedeemRewardsResult,
  RouteChatMessage,
} from "./commuteTypes";

const STORAGE_KEY = "busgraph_commute_store_v1";
const STORE_EVENT = "busgraph:store-updated";
const STORE_VERSION = 3;

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function isoOffset(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function daysAgoIso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

function createInitialSeedState(): CommuteDemoState {
  const studentId = "student-karachi-01";
  const now = Date.now();

  return {
    version: STORE_VERSION,
    profile: {
      _id: studentId,
      _type: "studentProfile",
      _createdAt: daysAgoIso(120),
      studentId,
      displayName: "Hamza Siddiqui",
      university: "NED / Karachi Commuter",
      verifiedStudent: true,
      coinBalance: 125,
      lifetimeCoinsEarned: 125,
      easypaisaNumber: "0300-1234567",
    },
    activeBoarding: null,
    spottings: [
      {
        _id: "spot-seed-r11",
        _type: "liveBusSpotting",
        _createdAt: isoOffset(3),
        routeId: "R11",
        stopName: "Miran Naka (Lyari)",
        lat: 24.8795,
        lng: 66.9956,
        crowdLevel: "seats",
        reportedBy: "Usman R. (Student)",
        verifiedStudent: true,
        spottedAt: isoOffset(3),
        expiresAt: new Date(now + 22 * 60_000).toISOString(),
        status: "active",
      },
      {
        _id: "spot-seed-r4",
        _type: "liveBusSpotting",
        _createdAt: isoOffset(6),
        routeId: "R4",
        stopName: "Numaish Chowrangi (M.A Jinnah Rd)",
        lat: 24.8722,
        lng: 67.0355,
        crowdLevel: "standing",
        reportedBy: "Bilal A. (Student)",
        verifiedStudent: true,
        spottedAt: isoOffset(6),
        expiresAt: new Date(now + 19 * 60_000).toISOString(),
        status: "active",
      },
      {
        _id: "spot-seed-ev1",
        _type: "liveBusSpotting",
        _createdAt: isoOffset(9),
        routeId: "EV1",
        stopName: "Teen Talwar (Clifton)",
        lat: 24.8385,
        lng: 67.031,
        crowdLevel: "seats",
        reportedBy: "Saad M. (Student)",
        verifiedStudent: true,
        spottedAt: isoOffset(9),
        expiresAt: new Date(now + 16 * 60_000).toISOString(),
        status: "active",
      },
    ],
    trips: [
      {
        _id: "trip-seed-1",
        _type: "commuteTrip",
        _createdAt: daysAgoIso(1),
        studentId,
        routeId: "R11",
        boardStopName: "Miran Naka (Lyari)",
        alightStopName: "Tower (Merewether Clock Tower / Saddar)",
        busDistanceKm: 5.7,
        walkDistanceKm: 1.15,
        durationMinutes: 26,
        farePkr: 80,
        rideHailEstimatePkr: 347,
        savingsPkr: 267,
        co2SavedKg: 0.46,
        coinsEarned: 15,
        boardedAt: daysAgoIso(1),
        exitedAt: daysAgoIso(1),
      },
      {
        _id: "trip-seed-2",
        _type: "commuteTrip",
        _createdAt: daysAgoIso(3),
        studentId,
        routeId: "R4",
        boardStopName: "Tower (Merewether Clock Tower / Saddar)",
        alightStopName: "Regal Chowk / Preedy Street",
        busDistanceKm: 4.3,
        walkDistanceKm: 0.9,
        durationMinutes: 20,
        farePkr: 80,
        rideHailEstimatePkr: 284,
        savingsPkr: 204,
        co2SavedKg: 0.34,
        coinsEarned: 15,
        boardedAt: daysAgoIso(3),
        exitedAt: daysAgoIso(3),
      },
      {
        _id: "trip-seed-3",
        _type: "commuteTrip",
        _createdAt: daysAgoIso(7),
        studentId,
        routeId: "R11",
        boardStopName: "Miran Naka (Lyari)",
        alightStopName: "Boat Basin (Clifton)",
        busDistanceKm: 8.4,
        walkDistanceKm: 1.4,
        durationMinutes: 35,
        farePkr: 80,
        rideHailEstimatePkr: 468,
        savingsPkr: 388,
        co2SavedKg: 0.67,
        coinsEarned: 15,
        boardedAt: daysAgoIso(7),
        exitedAt: daysAgoIso(7),
      },
      {
        _id: "trip-seed-4",
        _type: "commuteTrip",
        _createdAt: daysAgoIso(45),
        studentId,
        routeId: "R1",
        boardStopName: "NIPA Chowrangi (Gulshan)",
        alightStopName: "Numaish Chowrangi (M.A Jinnah Rd)",
        busDistanceKm: 9.8,
        walkDistanceKm: 1.1,
        durationMinutes: 38,
        farePkr: 80,
        rideHailEstimatePkr: 531,
        savingsPkr: 451,
        co2SavedKg: 0.78,
        coinsEarned: 15,
        boardedAt: daysAgoIso(45),
        exitedAt: daysAgoIso(45),
      },
      {
        _id: "trip-seed-5",
        _type: "commuteTrip",
        _createdAt: daysAgoIso(390),
        studentId,
        routeId: "EV1",
        boardStopName: "Quaidabad (Landhi / Malir)",
        alightStopName: "Metropole / Avari Towers",
        busDistanceKm: 17.4,
        walkDistanceKm: 0.8,
        durationMinutes: 48,
        farePkr: 120,
        rideHailEstimatePkr: 873,
        savingsPkr: 753,
        co2SavedKg: 1.39,
        coinsEarned: 15,
        boardedAt: daysAgoIso(390),
        exitedAt: daysAgoIso(390),
      },
    ],
    transactions: [
      {
        _id: "txn-seed-1",
        _type: "coinTransaction",
        _createdAt: daysAgoIso(1),
        studentId,
        kind: "earn_ride",
        coinsDelta: 15,
        description: "Verified ride on R11 (Miran Naka → Tower)",
        createdAt: daysAgoIso(1),
      },
      {
        _id: "txn-seed-2",
        _type: "coinTransaction",
        _createdAt: daysAgoIso(3),
        studentId,
        kind: "earn_ride",
        coinsDelta: 15,
        description: "Verified ride on R4 (Tower → Regal Chowk)",
        createdAt: daysAgoIso(3),
      },
      {
        _id: "txn-seed-3",
        _type: "coinTransaction",
        _createdAt: daysAgoIso(7),
        studentId,
        kind: "earn_alert",
        coinsDelta: 95,
        description: "Student onboarding bonus & verified route reports",
        createdAt: daysAgoIso(7),
      },
    ],
    chatMessages: [
      {
        _id: "chat-seed-1",
        _type: "routeChatMessage",
        _createdAt: isoOffset(14),
        routeId: "R11",
        studentId: "student-usman",
        senderName: "Usman R.",
        verifiedStudent: true,
        tagType: "crossed",
        message: "📍 Bus crossed Miran Naka (Lyari)",
        createdAt: isoOffset(14),
      },
      {
        _id: "chat-seed-2",
        _type: "routeChatMessage",
        _createdAt: isoOffset(11),
        routeId: "R11",
        studentId: "student-usman",
        senderName: "Usman R.",
        verifiedStudent: true,
        tagType: "crowd",
        message: "💺 Seats available — plenty of room near back door",
        createdAt: isoOffset(11),
      },
      {
        _id: "chat-seed-3",
        _type: "routeChatMessage",
        _createdAt: isoOffset(8),
        routeId: "R4",
        studentId: "student-bilal",
        senderName: "Bilal A.",
        verifiedStudent: true,
        tagType: "delay",
        message: "⚠️ Traffic delay near Numaish Chowrangi (approx +6 mins)",
        createdAt: isoOffset(8),
      },
    ],
  };
}

function readState(): CommuteDemoState {
  if (typeof window === "undefined") {
    return createInitialSeedState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialSeedState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as CommuteDemoState;
    if (!parsed || parsed.version !== STORE_VERSION) {
      const seed = createInitialSeedState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return parsed;
  } catch {
    return createInitialSeedState();
  }
}

function writeState(next: CommuteDemoState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}

/**
 * Subscribe to live changes across components and browser tabs.
 */
export function subscribeCommuteStore(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleCustom = () => onChange();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(STORE_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(STORE_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Returns the full snapshot synchronously for React state hydration.
 */
export function getCommuteSnapshot(): CommuteDemoState {
  return readState();
}

/**
 * Returns non-expired active bus spottings for rendering on the live map.
 */
export function getActiveBusSpottings(state: CommuteDemoState = readState()): LiveBusSpotting[] {
  const nowMs = Date.now();
  return state.spottings.filter(
    (s) => s.status === "active" && new Date(s.expiresAt).getTime() > nowMs
  );
}

/**
 * Step 1 Action: "I Boarded This Bus"
 * Broadcasts a live bus spotting pin on the map and starts an active ride session.
 */
export function boardBus(input: BoardBusInput): ActiveBoardingSession {
  const state = readState();
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + LIVE_SPOTTING_TTL_MS).toISOString();
  const spottingId = makeId("spot");

  const cleanPreviousSpottings = state.spottings.filter((s) => !s.isOwnSession);

  const newSpotting: LiveBusSpotting = {
    _id: spottingId,
    _type: "liveBusSpotting",
    _createdAt: nowIso,
    routeId: input.routeId,
    stopName: input.boardStopName,
    lat: input.boardLat,
    lng: input.boardLng,
    crowdLevel: input.crowdLevel,
    reportedBy: `${state.profile.displayName} (You)`,
    verifiedStudent: state.profile.verifiedStudent,
    spottedAt: nowIso,
    expiresAt: expiresIso,
    status: "active",
    isOwnSession: true,
  };

  const session: ActiveBoardingSession = {
    spottingId,
    routeId: input.routeId,
    boardStopName: input.boardStopName,
    boardLat: input.boardLat,
    boardLng: input.boardLng,
    boardedAt: nowIso,
    crowdLevel: input.crowdLevel,
    plannedAlightStopName: input.plannedAlightStopName,
    plannedAlightLat: input.plannedAlightLat,
    plannedAlightLng: input.plannedAlightLng,
    plannedBusDistanceM: input.plannedBusDistanceM,
    plannedWalkDistanceM: input.plannedWalkDistanceM,
  };

  writeState({
    ...state,
    activeBoarding: session,
    spottings: [newSpotting, ...cleanPreviousSpottings],
  });

  return session;
}

/**
 * Updates crowd status or stop on the user's current live spotting mid-ride.
 */
export function updateLiveSpottingCrowd(crowdLevel: CrowdLevel): void {
  const state = readState();
  if (!state.activeBoarding) return;

  const updatedSession: ActiveBoardingSession = {
    ...state.activeBoarding,
    crowdLevel,
  };

  const updatedSpottings = state.spottings.map((s) =>
    s._id === state.activeBoarding?.spottingId
      ? { ...s, crowdLevel, spottedAt: new Date().toISOString() }
      : s
  );

  writeState({
    ...state,
    activeBoarding: updatedSession,
    spottings: updatedSpottings,
  });
}

/**
 * Step 1 Action: "I Exited Bus"
 * Finalizes the ride, calculates distance/savings/CO2, records a CommuteTrip,
 * credits Commute Coins, and moves the live bus marker to the exit stop.
 */
export function exitBus(input: ExitBusInput): ExitBusResult {
  const state = readState();
  const session = state.activeBoarding;
  if (!session) {
    throw new Error("No active boarding session found.");
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const elapsedMin = Math.max(
    1,
    Math.round((nowMs - new Date(session.boardedAt).getTime()) / 60_000)
  );

  // Measure distance between boarding point and exit point (route-factored 1.25x for street curves)
  const rawMeters = haversineDistance(
    { lat: session.boardLat, lng: session.boardLng },
    { lat: input.alightLat, lng: input.alightLng }
  );

  let busDistanceKm: number;
  if (rawMeters >= 150) {
    busDistanceKm = Number(((rawMeters * 1.25) / 1000).toFixed(2));
  } else if (session.plannedBusDistanceM && session.plannedBusDistanceM > 0) {
    // Stationary desk demo fallback when Board & Exit are tapped on the same route
    busDistanceKm = Number((session.plannedBusDistanceM / 1000).toFixed(2));
  } else {
    busDistanceKm = 3.2;
  }

  const walkDistanceKm =
    input.walkDistanceKmOverride ??
    Number(((session.plannedWalkDistanceM ?? 650) / 1000).toFixed(2));

  const farePkr = calculateBusFarePkr(busDistanceKm);
  const rideHailEstimatePkr = Math.round(90 + busDistanceKm * 45);
  const savingsPkr = Math.max(0, rideHailEstimatePkr - farePkr);
  const co2SavedKg = Number((busDistanceKm * 0.08).toFixed(2));
  const coinsEarned = COINS_PER_VERIFIED_RIDE;

  const trip: CommuteTrip = {
    _id: makeId("trip"),
    _type: "commuteTrip",
    _createdAt: nowIso,
    studentId: state.profile.studentId,
    routeId: session.routeId,
    boardStopName: session.boardStopName,
    alightStopName: input.alightStopName,
    busDistanceKm,
    walkDistanceKm,
    durationMinutes: elapsedMin,
    farePkr,
    rideHailEstimatePkr,
    savingsPkr,
    co2SavedKg,
    coinsEarned,
    boardedAt: session.boardedAt,
    exitedAt: nowIso,
  };

  const newBalance = state.profile.coinBalance + coinsEarned;

  const txn = {
    _id: makeId("txn"),
    _type: "coinTransaction" as const,
    _createdAt: nowIso,
    studentId: state.profile.studentId,
    kind: "earn_ride" as const,
    coinsDelta: coinsEarned,
    description: `Verified ride on ${session.routeId} (${session.boardStopName} → ${input.alightStopName})`,
    createdAt: nowIso,
  };

  // Mark the user's bus spotting as having reached the exit stop & keep visible briefly as arrived
  const updatedSpottings = state.spottings.map((s) =>
    s._id === session.spottingId
      ? {
          ...s,
          stopName: input.alightStopName,
          lat: input.alightLat,
          lng: input.alightLng,
          spottedAt: nowIso,
          isOwnSession: false,
        }
      : s
  );

  writeState({
    ...state,
    profile: {
      ...state.profile,
      coinBalance: newBalance,
      lifetimeCoinsEarned: state.profile.lifetimeCoinsEarned + coinsEarned,
    },
    activeBoarding: null,
    spottings: updatedSpottings,
    trips: [trip, ...state.trips],
    transactions: [txn, ...state.transactions],
  });

  return { trip, coinsEarned, newBalance };
}

/**
 * Step 3 / Step 4 Reward Action: credits Commute Coins for helpful community alerts.
 */
export function awardAlertCoins(
  description: string,
  coins: number = COINS_PER_HELPFUL_ALERT
): number {
  const state = readState();
  const nowIso = new Date().toISOString();
  const newBalance = state.profile.coinBalance + coins;

  const txn = {
    _id: makeId("txn"),
    _type: "coinTransaction" as const,
    _createdAt: nowIso,
    studentId: state.profile.studentId,
    kind: "earn_alert" as const,
    coinsDelta: coins,
    description,
    createdAt: nowIso,
  };

  writeState({
    ...state,
    profile: {
      ...state.profile,
      coinBalance: newBalance,
      lifetimeCoinsEarned: state.profile.lifetimeCoinsEarned + coins,
    },
    transactions: [txn, ...state.transactions],
  });

  return newBalance;
}

/**
 * Step 3 Action: redeems Commute Coins directly via EasyPaisa cashout.
 */
export function redeemRewards(input: RedeemRewardsInput): RedeemRewardsResult {
  const state = readState();

  if (input.coinsToRedeem < CASHOUT_THRESHOLD_COINS) {
    throw new Error(
      `Minimum ${CASHOUT_THRESHOLD_COINS} coins required for EasyPaisa cashout.`
    );
  }
  if (input.coinsToRedeem > state.profile.coinBalance) {
    throw new Error("Insufficient Commute Coin balance.");
  }

  const normalizedPhone = input.easypaisaNumber.trim();
  if (!/^03\d{2}-?\d{7}$/.test(normalizedPhone)) {
    throw new Error("Enter a valid EasyPaisa number (e.g. 0300-1234567).");
  }

  const pkrAmount = Math.round(input.coinsToRedeem * COIN_VALUE_PKR);
  const receiptRef = `EP-${Math.floor(100000 + Math.random() * 900000)}`;
  const nowIso = new Date().toISOString();
  const newBalance = state.profile.coinBalance - input.coinsToRedeem;

  const description = `EasyPaisa cash payout to ${normalizedPhone}${
    input.accountTitle ? ` (${input.accountTitle.trim()})` : ""
  } • Ref ${receiptRef}`;

  const transaction = {
    _id: makeId("txn"),
    _type: "coinTransaction" as const,
    _createdAt: nowIso,
    studentId: state.profile.studentId,
    kind: "redeem_easypaisa" as const,
    coinsDelta: -input.coinsToRedeem,
    pkrAmount,
    description,
    referenceAccount: normalizedPhone,
    createdAt: nowIso,
  };

  writeState({
    ...state,
    profile: {
      ...state.profile,
      coinBalance: newBalance,
      easypaisaNumber: normalizedPhone || state.profile.easypaisaNumber,
    },
    transactions: [transaction, ...state.transactions],
  });

  return {
    transaction,
    receiptRef,
    pkrAmount,
    newBalance,
  };
}

/**
 * Step 4 Action: Posts a structured quick-tag alert or verified student message
 * to an isolated per-route channel (`#R11-chat`, `#EV3-chat`, etc.).
 * Helpful status alerts (`crossed`, `crowd`, `delay`) earn +5 Commute Coins.
 */
export function postRouteChatMessage(
  input: PostChatMessageInput
): PostChatMessageResult {
  const trimmed = input.message.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }
  if (trimmed.length > 240) {
    throw new Error("Message must be 240 characters or fewer.");
  }

  const state = readState();
  const nowIso = new Date().toISOString();

  const entry: RouteChatMessage = {
    _id: makeId("chat"),
    _type: "routeChatMessage",
    _createdAt: nowIso,
    routeId: input.routeId,
    studentId: state.profile.studentId,
    senderName: state.profile.displayName,
    verifiedStudent: state.profile.verifiedStudent,
    tagType: input.tagType,
    message: trimmed,
    createdAt: nowIso,
  };

  const coinsAwarded =
    input.tagType !== "free" ? COINS_PER_HELPFUL_ALERT : 0;
  const newBalance = state.profile.coinBalance + coinsAwarded;

  const updatedTransactions =
    coinsAwarded > 0
      ? [
          {
            _id: makeId("txn"),
            _type: "coinTransaction" as const,
            _createdAt: nowIso,
            studentId: state.profile.studentId,
            kind: "earn_alert" as const,
            coinsDelta: coinsAwarded,
            description: `Helpful route alert in #${input.routeId}-chat`,
            createdAt: nowIso,
          },
          ...state.transactions,
        ]
      : state.transactions;

  writeState({
    ...state,
    profile: {
      ...state.profile,
      coinBalance: newBalance,
      lifetimeCoinsEarned: state.profile.lifetimeCoinsEarned + coinsAwarded,
    },
    chatMessages: [...state.chatMessages, entry],
    transactions: updatedTransactions,
  });

  return { entry, coinsAwarded, newBalance };
}



