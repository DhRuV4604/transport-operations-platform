// Coordinate lookup + SVG projection for the Live Map.
//
// Trips store source/destination as free-text city names (no coordinates in the
// DB), so we resolve known Indian cities to lat/lng here and project them into
// the viewBox of the stylized India map used on the Live Map page.

export type LatLng = { lat: number; lng: number };

// Well-known Indian cities that appear as trip source/destinations. Extend this
// as new routes are added; unknown cities fall back to their region centroid.
export const CITY_COORDS: Record<string, LatLng> = {
  Delhi: { lat: 28.61, lng: 77.21 },
  Jaipur: { lat: 26.91, lng: 75.79 },
  Mumbai: { lat: 19.08, lng: 72.88 },
  Pune: { lat: 18.52, lng: 73.86 },
  Nashik: { lat: 20.01, lng: 73.79 },
  Nagpur: { lat: 21.15, lng: 79.09 },
  Ahmedabad: { lat: 23.03, lng: 72.58 },
  Surat: { lat: 21.17, lng: 72.83 },
  Bengaluru: { lat: 12.97, lng: 77.59 },
  Mysuru: { lat: 12.3, lng: 76.64 },
  Kolkata: { lat: 22.57, lng: 88.36 },
  Chennai: { lat: 13.08, lng: 80.27 },
  Hyderabad: { lat: 17.39, lng: 78.49 },
  Lucknow: { lat: 26.85, lng: 80.95 },
  Bhopal: { lat: 23.26, lng: 77.41 },
  Guwahati: { lat: 26.14, lng: 91.74 },
  Kochi: { lat: 9.93, lng: 76.27 },
  Raipur: { lat: 21.25, lng: 81.63 },
};

// Approximate region centroids for cities we don't have exact coords for.
export const REGION_COORDS: Record<string, LatLng> = {
  NORTH: { lat: 28.0, lng: 77.0 },
  SOUTH: { lat: 13.0, lng: 78.0 },
  WEST: { lat: 20.5, lng: 73.5 },
  EAST: { lat: 22.5, lng: 86.0 },
};

export function resolveCoords(city: string, region?: string): LatLng {
  return (
    CITY_COORDS[city] ??
    (region ? REGION_COORDS[region] : undefined) ??
    // Center of the map as a last resort so nothing renders off-canvas.
    { lat: 22.0, lng: 79.0 }
  );
}

// Geographic bounds of the India map — the true mainland+NE bounding box, so
// the outline in india-map.ts (generated with these same numbers) is correctly
// proportioned and cities land in the right place.
const BOUNDS = { minLat: 6.5, maxLat: 37.2, minLng: 68.1, maxLng: 97.4 };

// The SVG viewBox the map is drawn in. Aspect ~ Δlng:Δlat so the country isn't
// stretched. Points are projected into this space.
export const MAP_VIEWBOX = { width: 560, height: 588 };

// Simple equirectangular projection into the viewBox. Good enough at country
// scale for a schematic map (we're not doing precise cartography).
export function project({ lat, lng }: LatLng): { x: number; y: number } {
  const x =
    ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * MAP_VIEWBOX.width;
  const y =
    ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * MAP_VIEWBOX.height;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}
