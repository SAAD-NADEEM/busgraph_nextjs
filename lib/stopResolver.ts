import { LatLng, haversineDistance } from "./haversine";

/**
 * Curated Karachi transit hubs, intersections, and landmarks across all 15 PBS routes.
 * Using 600m-1200m radius allows instant zero-latency offline identification of stops.
 */
export const KARACHI_TRANSIT_STOPS: { name: string; point: LatLng; radiusM: number }[] = [
  // ── Shahrah-e-Faisal Corridor ──────────────────────────────────────
  { name: "Drigh Road Station (Shahrah-e-Faisal)", point: { lat: 24.8872, lng: 67.1345 }, radiusM: 1200 },
  { name: "PAF Base Faisal / Drigh Colony", point: { lat: 24.8873, lng: 67.1275 }, radiusM: 1000 },
  { name: "Star Gate / Airport", point: { lat: 24.8870, lng: 67.1510 }, radiusM: 1000 },
  { name: "Jinnah International Airport", point: { lat: 24.8975, lng: 67.1610 }, radiusM: 1100 },
  { name: "Malir Halt (Shahrah-e-Faisal)", point: { lat: 24.8849, lng: 67.1755 }, radiusM: 1000 },
  { name: "Karsaz (Shahrah-e-Faisal)", point: { lat: 24.8770, lng: 67.0930 }, radiusM: 1000 },
  { name: "Baloch Colony Bridge", point: { lat: 24.8680, lng: 67.0780 }, radiusM: 900 },
  { name: "Nursery (Shahrah-e-Faisal)", point: { lat: 24.8625, lng: 67.0650 }, radiusM: 900 },
  { name: "FTC / Gora Qabristan", point: { lat: 24.8568, lng: 67.0505 }, radiusM: 1000 },
  { name: "Metropole / Avari Towers", point: { lat: 24.8525, lng: 67.0310 }, radiusM: 900 },

  // ── DHA / Clifton / Korangi Road ───────────────────────────────────
  { name: "DHA Phase 2 Ext / Sunset Blvd", point: { lat: 24.8355, lng: 67.0685 }, radiusM: 1100 },
  { name: "DHA Phase 1 / Korangi Road", point: { lat: 24.8430, lng: 67.0680 }, radiusM: 900 },
  { name: "Submarine Chowrangi / Punjab Colony", point: { lat: 24.8270, lng: 67.0440 }, radiusM: 1000 },
  { name: "Qayyumabad Chowrangi", point: { lat: 24.8375, lng: 67.0870 }, radiusM: 1000 },
  { name: "Defence Mor / Gold Mark", point: { lat: 24.8360, lng: 67.0630 }, radiusM: 900 },
  { name: "Dolmen Mall Clifton", point: { lat: 24.8036, lng: 67.0284 }, radiusM: 1000 },
  { name: "Sea View / Clock Tower Clifton", point: { lat: 24.8487, lng: 66.9966 }, radiusM: 1000 },
  { name: "Ziauddin Hospital (Clifton)", point: { lat: 24.8172, lng: 67.0072 }, radiusM: 1000 },
  { name: "Bilawal Chowrangi", point: { lat: 24.8210, lng: 67.0260 }, radiusM: 900 },
  { name: "Boat Basin (Clifton)", point: { lat: 24.8250, lng: 67.0290 }, radiusM: 900 },
  { name: "Teen Talwar (Clifton)", point: { lat: 24.8385, lng: 67.0310 }, radiusM: 900 },
  { name: "Do Talwar (Clifton)", point: { lat: 24.8320, lng: 67.0315 }, radiusM: 900 },

  // ── Saddar / Downtown / City Centre ────────────────────────────────
  { name: "Lucky Star / Empress Market (Saddar)", point: { lat: 24.8570, lng: 67.0334 }, radiusM: 1000 },
  { name: "Regal Chowk / Preedy Street", point: { lat: 24.8588, lng: 67.0270 }, radiusM: 900 },
  { name: "Numaish Chowrangi (M.A Jinnah Rd)", point: { lat: 24.8722, lng: 67.0355 }, radiusM: 1100 },
  { name: "Guru Mandir Chowrangi", point: { lat: 24.8820, lng: 67.0370 }, radiusM: 1000 },
  { name: "Tower (Merewether Clock Tower / Saddar)", point: { lat: 24.8481, lng: 66.9954 }, radiusM: 1100 },
  { name: "Shaheen Complex / Arts Council", point: { lat: 24.8525, lng: 67.0180 }, radiusM: 900 },
  { name: "City Courts / Bolton Market", point: { lat: 24.8560, lng: 67.0050 }, radiusM: 900 },
  { name: "Cantt Station", point: { lat: 24.8480, lng: 67.0350 }, radiusM: 900 },
  { name: "Jinnah Hospital (JPMC)", point: { lat: 24.8520, lng: 67.0450 }, radiusM: 900 },

  // ── Gulshan-e-Iqbal / University Road Corridor ─────────────────────
  { name: "NIPA Chowrangi (Gulshan)", point: { lat: 24.9180, lng: 67.0975 }, radiusM: 1000 },
  { name: "Gulshan Chowrangi", point: { lat: 24.9295, lng: 67.0855 }, radiusM: 1000 },
  { name: "Civic Centre / Hassan Square", point: { lat: 24.9015, lng: 67.0782 }, radiusM: 1000 },
  { name: "National Stadium", point: { lat: 24.8930, lng: 67.0790 }, radiusM: 900 },
  { name: "COD / Rashid Minhas Road", point: { lat: 24.8930, lng: 67.1120 }, radiusM: 1000 },
  { name: "KDA Scheme 1 / Karsaz Mor", point: { lat: 24.8870, lng: 67.0900 }, radiusM: 900 },
  { name: "Urdu University / Gulshan Iqbal Block 7", point: { lat: 24.9120, lng: 67.0870 }, radiusM: 1000 },
  { name: "NED University / Karachi University Gate", point: { lat: 24.9315, lng: 67.1110 }, radiusM: 1200 },
  { name: "Maskan Chowrangi", point: { lat: 24.9350, lng: 67.0980 }, radiusM: 900 },
  { name: "Safoora Chowrangi", point: { lat: 24.9430, lng: 67.1450 }, radiusM: 1100 },
  { name: "Johar Mor / Millenium Mall", point: { lat: 24.8980, lng: 67.1180 }, radiusM: 1000 },
  { name: "Kamran Chowrangi (Gulistan-e-Johar)", point: { lat: 24.9180, lng: 67.1290 }, radiusM: 1000 },

  // ── Liaquatabad / F.B Area / North Nazimabad ────────────────────────
  { name: "Karimabad / Meena Bazaar", point: { lat: 24.9180, lng: 67.0540 }, radiusM: 1000 },
  { name: "Liaquatabad Supermarket / 10 Number", point: { lat: 24.9100, lng: 67.0420 }, radiusM: 1000 },
  { name: "Dak Khana (Liaquatabad)", point: { lat: 24.9040, lng: 67.0390 }, radiusM: 900 },
  { name: "Nazimabad 7 / Inquiry Office", point: { lat: 24.9230, lng: 67.0310 }, radiusM: 1000 },
  { name: "Golimar Chowrangi", point: { lat: 24.8980, lng: 67.0220 }, radiusM: 1000 },
  { name: "Ayesha Manzil (F.B Area)", point: { lat: 24.9272, lng: 67.0643 }, radiusM: 1000 },
  { name: "Water Pump Chowrangi (F.B Area)", point: { lat: 24.9380, lng: 67.0720 }, radiusM: 1000 },
  { name: "Sohrab Goth Terminal", point: { lat: 24.9436, lng: 67.0847 }, radiusM: 1100 },
  { name: "Sakhi Hassan Chowrangi", point: { lat: 24.9600, lng: 67.0680 }, radiusM: 1000 },
  { name: "Nagan Chowrangi", point: { lat: 24.9680, lng: 67.0680 }, radiusM: 1000 },
  { name: "Power House Chowrangi (North Karachi)", point: { lat: 24.9853, lng: 67.0659 }, radiusM: 1100 },
  { name: "4K Chowrangi (North Karachi)", point: { lat: 25.0020, lng: 67.0650 }, radiusM: 1000 },

  // ── Korangi / Landhi Corridor ──────────────────────────────────────
  { name: "Korangi Crossing", point: { lat: 24.8250, lng: 67.1060 }, radiusM: 1000 },
  { name: "Indus Hospital (Korangi Crossing)", point: { lat: 24.8170, lng: 67.1081 }, radiusM: 1000 },
  { name: "Nasir Jump (Korangi)", point: { lat: 24.8204, lng: 67.1251 }, radiusM: 1000 },
  { name: "Korangi No. 2 1/2", point: { lat: 24.8260, lng: 67.1350 }, radiusM: 1000 },
  { name: "Korangi No. 4", point: { lat: 24.8320, lng: 67.1470 }, radiusM: 1000 },
  { name: "Ibrahim Hyderi", point: { lat: 24.7945, lng: 67.1362 }, radiusM: 1100 },
  { name: "Landhi 89", point: { lat: 24.8430, lng: 67.1850 }, radiusM: 1000 },
  { name: "Quaidabad (Landhi / Malir)", point: { lat: 24.8580, lng: 67.1980 }, radiusM: 1100 },

  // ── Malir / National Highway / Super Highway ───────────────────────
  { name: "Malir 15", point: { lat: 24.8720, lng: 67.1950 }, radiusM: 1000 },
  { name: "Khokhrapar No. 1 (Malir)", point: { lat: 24.9055, lng: 67.2093 }, radiusM: 1000 },
  { name: "Memon Goth (Malir)", point: { lat: 24.9135, lng: 67.2459 }, radiusM: 1100 },
  { name: "Malir Cantt Check Post 5", point: { lat: 24.9488, lng: 67.2144 }, radiusM: 1100 },
  { name: "Malir Cantt Check Post 6", point: { lat: 24.9350, lng: 67.1950 }, radiusM: 1000 },
  { name: "Gulshan-e-Hadeed / Steel Town", point: { lat: 24.8620, lng: 67.3450 }, radiusM: 1200 },
  { name: "Al Khidmat Hadeed", point: { lat: 24.8710, lng: 67.3722 }, radiusM: 1200 },
  { name: "Bahria Town Karachi Terminal", point: { lat: 25.0712, lng: 67.3055 }, radiusM: 1300 },
  { name: "DHA City Karachi", point: { lat: 25.0379, lng: 67.4467 }, radiusM: 1400 },

  // ── Lyari / Kemari / West / Baldia ────────────────────────────────
  { name: "Miran Naka (Lyari)", point: { lat: 24.8795, lng: 66.9956 }, radiusM: 1000 },
  { name: "Lee Market (Lyari)", point: { lat: 24.8640, lng: 67.0010 }, radiusM: 900 },
  { name: "Dockyard (Kemari)", point: { lat: 24.8307, lng: 66.9711 }, radiusM: 1000 },
  { name: "Keamari Jetty", point: { lat: 24.8184, lng: 66.9749 }, radiusM: 1000 },
  { name: "Yousuf Goth (Baldia Town)", point: { lat: 24.9585, lng: 66.9239 }, radiusM: 1100 },
  { name: "Hawksbay Beach Terminal", point: { lat: 24.8629, lng: 66.8495 }, radiusM: 1200 },
  { name: "SITE Area / Habib Bank Chowrangi", point: { lat: 24.8980, lng: 67.0050 }, radiusM: 1000 },
  { name: "Gulbai Chowrangi", point: { lat: 24.8650, lng: 66.9750 }, radiusM: 1000 },
];

/** In-memory cache for dynamic reverse geocoded names */
const reverseGeocodeCache = new Map<string, string>();

/**
 * Resolves a friendly stop name for any coordinate along a route:
 * 1. Checks 60+ known Karachi transit hubs and major intersections.
 * 2. Checks route endpoints in the KML title if near route start/end.
 * 3. Calls OpenStreetMap Nominatim reverse geocode (cached in memory) for precise road/suburb names.
 * 4. Falls back to localized town area name if offline/network fails.
 */
export async function resolveStopName(
  pt: LatLng,
  routeName: string,
  isNearStart: boolean,
  isNearEnd: boolean
): Promise<string> {
  // 1. Check known hubs and landmarks
  let closestHub: string | null = null;
  let closestDist = Infinity;
  for (const hub of KARACHI_TRANSIT_STOPS) {
    const d = haversineDistance(pt, hub.point);
    if (d < hub.radiusM && d < closestDist) {
      closestDist = d;
      closestHub = hub.name;
    }
  }
  if (closestHub) return closestHub;

  // 2. Extract endpoints from route name if at terminal: "R12 (Memon Goth to Lucky Star)"
  const match = routeName.match(/\((.+?)\s+to\s+(.+?)\)/i);
  if (match) {
    if (isNearStart) return `${match[1].trim()} Terminal`;
    if (isNearEnd) return `${match[2].trim()} Terminal`;
  }

  // 3. Dynamic reverse geocode with OSM Nominatim
  const cacheKey = `${pt.lat.toFixed(4)},${pt.lng.toFixed(4)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${pt.lat}&lon=${pt.lng}&format=json&accept-language=en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "busgraph-karachi" },
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const primary = addr.road || addr.neighbourhood || addr.amenity || addr.suburb;
      const secondary = addr.suburb && addr.suburb !== primary ? addr.suburb : addr.town;

      let resolved = "";
      if (primary && secondary && !primary.includes(secondary)) {
        resolved = `${primary} (${secondary})`;
      } else if (primary) {
        resolved = primary;
      } else if (secondary) {
        resolved = secondary;
      }

      if (resolved) {
        reverseGeocodeCache.set(cacheKey, resolved);
        return resolved;
      }
    }
  } catch {
    // Graceful fallback to zone boundaries if offline
  }

  // 4. City region geographic fallback
  if (pt.lat > 24.96) return "North Karachi";
  if (pt.lat > 24.92 && pt.lng < 67.07) return "F.B Area / Liaquatabad";
  if (pt.lat > 24.90 && pt.lng >= 67.07) return "Gulshan-e-Iqbal";
  if (pt.lat < 24.835 && pt.lng < 67.075) return "DHA / Clifton";
  if (pt.lat < 24.84 && pt.lng >= 67.08) return "Korangi Industrial Area";
  if (pt.lat >= 24.84 && pt.lat <= 24.87 && pt.lng <= 67.04) return "Saddar / Cantt";
  if (pt.lat >= 24.87 && pt.lat <= 24.89 && pt.lng >= 67.11 && pt.lng <= 67.16) return "Shahrah-e-Faisal / Drigh Road";
  if (pt.lng > 67.18) return "Malir";

  return `Stop near ${routeName.split(" ")[0]}`;
}
