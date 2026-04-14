export async function getRoute(
  origin: { lng: number; lat: number },
  dest: { lng: number; lat: number },
) {
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`,
  );
  const data = await res.json();
  if (!data.routes || !data.routes.length) throw new Error("No route found");
  return data.routes[0].geometry.coordinates; // same [lng, lat] array format
}
