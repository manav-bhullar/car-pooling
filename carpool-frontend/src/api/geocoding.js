const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

// Patiala bounding box: west, south, east, north
const PATIALA_VIEWBOX = '76.2,30.2,76.6,30.5';

/**
 * Search for locations using Nominatim.
 * Returns array of { displayName, lat, lng }.
 */
export async function searchLocation(query) {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    limit: '5',
    viewbox: PATIALA_VIEWBOX,
    addressdetails: '0',
  });

  const url = `${NOMINATIM_BASE}?${params}`;

  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
    },
  });

  if (!res.ok) {
    throw new Error('Location search failed');
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}
