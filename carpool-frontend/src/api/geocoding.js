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
    countrycodes: 'in',
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

/**
 * Reverse geocode a latitude and longitude using Nominatim.
 * Returns { displayName, lat, lng } or null.
 */
export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    lat,
    lon: lng,
    format: 'json',
  });

  const url = `https://nominatim.openstreetmap.org/reverse?${params}`;

  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
    },
  });

  if (!res.ok) {
    throw new Error('Reverse geocoding failed');
  }

  const data = await res.json();
  
  if (data && data.display_name) {
    return {
      displayName: data.display_name,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon)
    };
  }
  return null;
}
