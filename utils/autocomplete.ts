// Karachi bounding box [min_lon, min_lat, max_lon, max_lat]
const KARACHI_BBOX = "66.8,24.75,67.25,25.1";

export interface AutocompleteResult {
  name: string; // Clean short place name (e.g. "Miran Naka")
  subtitle: string; // Context line (e.g. "Lyari Town, Karachi District")
  label: string; // Display label for input
  coords: [number, number]; // [lng, lat]
}

/** Pre-indexed bus terminals and major PBS bus transit points */
const BUS_TERMINALS: (AutocompleteResult & { keywords: string[] })[] = [
  {
    name: "Miran Naka (Lyari)",
    subtitle: "🚌 R11 Starting Terminal, Lyari",
    label: "Miran Naka (Lyari)",
    coords: [66.995567, 24.879511],
    keywords: ["miran", "naka", "nakka", "lyari", "r11"],
  },
  {
    name: "Ziauddin Hospital (Clifton)",
    subtitle: "🚌 R11 Ending Terminal, Clifton",
    label: "Ziauddin Hospital (Clifton)",
    coords: [67.00716, 24.81721],
    keywords: ["ziauddin", "hospital", "clifton", "r11"],
  },
  {
    name: "Power House Chowrangi",
    subtitle: "🚌 R2 / R3 / R4 Starting Terminal, North Karachi",
    label: "Power House Chowrangi",
    coords: [67.06588, 24.98534],
    keywords: ["power", "house", "chowrangi", "north", "karachi", "r2", "r3", "r4"],
  },
  {
    name: "Nasir Jump (Korangi)",
    subtitle: "🚌 R3 Ending Terminal, Korangi",
    label: "Nasir Jump (Korangi)",
    coords: [67.1251, 24.82039],
    keywords: ["nasir", "jump", "korangi", "r3"],
  },
  {
    name: "Indus Hospital (Korangi Crossing)",
    subtitle: "🚌 R2 Ending Terminal, Korangi",
    label: "Indus Hospital (Korangi Crossing)",
    coords: [67.108124, 24.817002],
    keywords: ["indus", "hospital", "korangi", "crossing", "r2"],
  },
  {
    name: "Numaish (M.A Jinnah Road)",
    subtitle: "🚌 R10 / EV3 Terminal, Numaish",
    label: "Numaish Chowrangi",
    coords: [67.03548, 24.87223],
    keywords: ["numaish", "jinnah", "chowrangi", "r10", "ev3"],
  },
  {
    name: "Ibrahim Hyderi",
    subtitle: "🚌 R10 Ending Terminal, Korangi",
    label: "Ibrahim Hyderi",
    coords: [67.13619, 24.79453],
    keywords: ["ibrahim", "hyderi", "korangi", "r10"],
  },
  {
    name: "Khokhrapar (Malir)",
    subtitle: "🚌 R1 Starting Terminal, Malir",
    label: "Khokhrapar No. 1",
    coords: [67.20928, 24.90553],
    keywords: ["khokhrapar", "khokrapar", "malir", "r1"],
  },
  {
    name: "Dockyard (Kemari)",
    subtitle: "🚌 R1 Ending Terminal, Kemari",
    label: "Dockyard (Kemari)",
    coords: [66.97111, 24.83071],
    keywords: ["dockyard", "kemari", "keamari", "r1"],
  },
  {
    name: "Tower (Saddar)",
    subtitle: "🚌 R9 / R13 Ending Terminal, Tower",
    label: "Tower (Saddar)",
    coords: [66.99544, 24.8481],
    keywords: ["tower", "saddar", "r9", "r13", "r4"],
  },
  {
    name: "Sea View (Clifton)",
    subtitle: "🚌 R8 Ending Terminal, Clifton",
    label: "Sea View (Clifton)",
    coords: [66.9966, 24.84874],
    keywords: ["sea", "view", "clifton", "r8"],
  },
  {
    name: "Yousuf Goth",
    subtitle: "🚌 R8 Starting Terminal, Baldia Town",
    label: "Yousuf Goth",
    coords: [66.92394, 24.95853],
    keywords: ["yousuf", "goth", "baldia", "r8"],
  },
  {
    name: "Malir Cantt",
    subtitle: "🚌 EV1 / EV3 Starting Terminal, Malir Cantt",
    label: "Malir Cantt Check Post 5",
    coords: [67.2144, 24.94879],
    keywords: ["malir", "cantt", "ev1", "ev3"],
  },
  {
    name: "Dolmen Mall Clifton",
    subtitle: "🚌 EV1 Ending Terminal, Clifton",
    label: "Dolmen Mall Clifton",
    coords: [67.02837, 24.8036],
    keywords: ["dolmen", "mall", "clifton", "ev1"],
  },
  {
    name: "Bahria Town",
    subtitle: "🚌 EV2 / EV4 Starting Terminal, Bahria Town",
    label: "Bahria Town",
    coords: [67.30545, 25.07125],
    keywords: ["bahria", "town", "ev2", "ev4"],
  },
  {
    name: "Malir Halt",
    subtitle: "🚌 EV2 Ending Terminal, Malir",
    label: "Malir Halt",
    coords: [67.17551, 24.88488],
    keywords: ["malir", "halt", "ev2"],
  },
  {
    name: "Ayesha Manzil",
    subtitle: "🚌 EV4 Ending Terminal, F.B Area",
    label: "Ayesha Manzil",
    coords: [67.06427, 24.92721],
    keywords: ["ayesha", "manzil", "fb", "area", "ev4"],
  },
  {
    name: "Sohrab Goth",
    subtitle: "🚌 EV5 Ending Terminal, Sohrab Goth",
    label: "Sohrab Goth",
    coords: [67.08471, 24.94362],
    keywords: ["sohrab", "goth", "ev5"],
  },
  {
    name: "Lucky Star (Saddar)",
    subtitle: "🚌 R12 Ending Terminal, Saddar",
    label: "Lucky Star (Saddar)",
    coords: [67.03341, 24.85697],
    keywords: ["lucky", "star", "saddar", "r12"],
  },
  {
    name: "Hawksbay",
    subtitle: "🚌 R13 Starting Terminal, Hawksbay",
    label: "Hawksbay",
    coords: [66.84951, 24.86285],
    keywords: ["hawksbay", "hawks", "bay", "r13"],
  },
];

/** Generate simple spelling variants to improve fuzzy recall from Nominatim */
function buildVariants(query: string): string[] {
  const variants = new Set<string>();
  variants.add(query);

  // Collapse repeated vowels: "bachaa" → "bacha"
  const collapsed = query.replace(/([aeiou])\1+/gi, "$1");
  if (collapsed !== query) variants.add(collapsed);

  // Expand last vowel: "bacha" → "bachaa"
  const expanded = query.replace(/([aeiou])(\s|$)/gi, "$1$1$2");
  if (expanded !== query) variants.add(expanded);

  // Strip double letters for consonants: "allama" → "alama"
  const dedoubled = query.replace(/([^aeiou\s])\1+/gi, "$1");
  if (dedoubled !== query) variants.add(dedoubled);

  return Array.from(variants);
}

/**
 * Build a clean, short display name and contextual subtitle from Nominatim.
 */
function cleanName(item: any): { name: string; subtitle: string } {
  const addr = item.address || {};

  // Primary name: prefer specific place or amenity, or first segment of display_name
  const primaryName =
    item.name ||
    addr.amenity ||
    addr.shop ||
    addr.building ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.road ||
    item.display_name?.split(",")[0]?.trim() ||
    "";

  // Build subtitle context
  const parts: string[] = [];

  // 1. Specific street / neighbourhood context
  if (addr.road && addr.road !== primaryName) {
    if (
      addr.neighbourhood &&
      addr.neighbourhood !== primaryName &&
      addr.neighbourhood !== addr.road
    ) {
      parts.push(`${addr.road}, ${addr.neighbourhood}`);
    } else {
      parts.push(addr.road);
    }
  } else if (addr.neighbourhood && addr.neighbourhood !== primaryName) {
    parts.push(addr.neighbourhood);
  }

  // 2. Area / Town / District context
  const contextKeys = ["suburb", "town", "city_district"];
  for (const key of contextKeys) {
    const val = addr[key];
    if (
      val &&
      val !== primaryName &&
      !parts.some((p) => p.toLowerCase().includes(val.toLowerCase()))
    ) {
      parts.push(val);
      if (parts.length >= 2) break;
    }
  }

  // 3. Fallback to display_name segments if parts is empty
  if (parts.length === 0 && item.display_name) {
    const segments = item.display_name
      .split(",")
      .map((s: string) => s.trim())
      .filter(
        (s: string) =>
          s !== primaryName &&
          s.toLowerCase() !== "pakistan" &&
          s.toLowerCase() !== "sindh"
      );
    if (segments.length > 0) {
      parts.push(segments.slice(0, 2).join(", "));
    }
  }

  const subtitle = parts.length > 0 ? parts.join(", ") : "Karachi";

  return {
    name: primaryName,
    subtitle,
  };
}

async function fetchSuggestions(query: string): Promise<AutocompleteResult[]> {
  const searchQuery = query.toLowerCase().includes("karachi")
    ? query
    : `${query}, Karachi`;

  const params = new URLSearchParams({
    q: searchQuery,
    format: "json",
    limit: "5",
    countrycodes: "pk",
    addressdetails: "1",
    "accept-language": "en",
    viewbox: KARACHI_BBOX,
    bounded: "1",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": "busgraph-nextjs" },
  });
  if (!res.ok) return [];
  const data = await res.json();

  return data.map((f: any) => {
    const { name, subtitle } = cleanName(f);
    return {
      name,
      subtitle,
      label: name ? `${name}, ${subtitle}` : f.display_name,
      coords: [parseFloat(f.lon), parseFloat(f.lat)] as [number, number],
      _key: `${Math.round(parseFloat(f.lat) * 1000)},${Math.round(parseFloat(f.lon) * 1000)}`,
    };
  });
}

export async function getAutocomplete(query: string): Promise<AutocompleteResult[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const matchedTerminals: AutocompleteResult[] = [];
  const qTokens = q.split(/\s+/).filter(Boolean);

  // Match local bus terminals / transit hubs
  for (const terminal of BUS_TERMINALS) {
    const matchesAll = qTokens.every(
      (token) =>
        terminal.name.toLowerCase().includes(token) ||
        terminal.keywords.some((k) => k.includes(token))
    );
    if (matchesAll) {
      matchedTerminals.push({
        name: terminal.name,
        subtitle: terminal.subtitle,
        label: terminal.label,
        coords: terminal.coords,
      });
    }
  }

  // Fetch Nominatim results with variants
  const variants = buildVariants(query.trim());
  const results = await Promise.all(variants.map(fetchSuggestions));

  // Merge bus terminals first, then Nominatim results deduplicated
  const seen = new Set<string>();
  const merged: AutocompleteResult[] = [];

  for (const item of matchedTerminals) {
    const key = `${Math.round(item.coords[1] * 1000)},${Math.round(item.coords[0] * 1000)}`;
    seen.add(key);
    merged.push(item);
  }

  for (const list of results) {
    for (const item of list) {
      const key = (item as any)._key;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({
          name: item.name,
          subtitle: item.subtitle,
          label: item.label,
          coords: item.coords,
        });
      }
    }
  }

  return merged.slice(0, 7);
}
