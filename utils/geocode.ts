export async function geocode(address: string) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?limit=1&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
  );
  const data = await res.json();
  if (!data.features.length) throw new Error("Address not found");
  const [lng, lat] = data.features[0].center;
  return { lng, lat };
}
