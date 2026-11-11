export interface AutocompleteResult {
  label: string;
  coords: [number, number];
}

/**
 * Standard location search querying OpenStreetMap Nominatim for full location names.
 */
export async function getAutocomplete(query: string): Promise<AutocompleteResult[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const searchQuery = q.toLowerCase().includes("karachi") ? q : `${q}, Karachi`;

  const params = new URLSearchParams({
    q: searchQuery,
    format: "json",
    limit: "6",
    countrycodes: "pk",
    addressdetails: "1",
    "accept-language": "en",
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "busgraph-nextjs" },
    });
    if (!res.ok) return [];
    const data = await res.json();

    const seen = new Set<string>();
    const results: AutocompleteResult[] = [];

    for (const f of data) {
      const label: string = f.display_name;
      if (!seen.has(label)) {
        seen.add(label);
        results.push({
          label,
          coords: [parseFloat(f.lon), parseFloat(f.lat)],
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}
