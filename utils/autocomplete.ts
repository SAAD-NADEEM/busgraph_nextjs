export async function getAutocomplete(query: string) {
  if (!query || query.length < 2) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=pk&addressdetails=1`,
    { headers: { "User-Agent": "busgraph-nextjs" } },
  );
  const data = await res.json();
  return data.map((f: any) => ({
    label: f.display_name,
    coords: [parseFloat(f.lon), parseFloat(f.lat)] as [number, number],
  }));
}
