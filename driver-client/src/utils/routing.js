import polyline from '@mapbox/polyline';

export const fetchOSRMRoute = async (positions) => {
  if (!positions || positions.length < 2) return [];

  // OSRM expects coordinates as lng,lat
  const coordsString = positions.map(p => `${p[1]},${p[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Routing API failed');
    }
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      // Decode the polyline. @mapbox/polyline returns [lat, lng] array which is exactly what Leaflet Polyline expects
      const encodedStr = data.routes[0].geometry;
      const decodedPoints = polyline.decode(encodedStr);
      return decodedPoints;
    }
    return [];
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    // Fallback to straight lines if API fails
    return positions;
  }
};
