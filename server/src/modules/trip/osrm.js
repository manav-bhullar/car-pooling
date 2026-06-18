const { haversine } = require('../matching/utils');

const OSRM_BASE_URL = 'http://router.project-osrm.org/route/v1/driving';
const ROAD_TO_HAVERSINE_CORRECTION = 1.35;
const SANITY_MULTIPLIER = 3.0;
const ROAD_DETOUR_THRESHOLD = 0.40;

/**
 * Build OSRM URL from ordered stops.
 * OSRM expects: longitude,latitude (NOT lat,lng — this is the most common mistake)
 */
function buildOsrmUrl(orderedStops) {
  const coords = orderedStops
    .map(stop => `${stop.lng},${stop.lat}`)
    .join(';');
  return `${OSRM_BASE_URL}/${coords}?overview=false`;
}

/**
 * Calculate individual solo road distances using OSRM correction factor.
 * We do not call OSRM for each solo trip — too many API calls.
 * Instead we apply the correction factor to Haversine solo distances.
 * This is consistent and fast.
 */
function getSoloRoadDistances(users) {
  return users.map(u => ({
    userId: u.userId,
    rideRequestId: u.rideRequestId,
    soloDistance: haversine(u.pickupLat, u.pickupLng, u.dropLat, u.dropLng) * ROAD_TO_HAVERSINE_CORRECTION,
  }));
}

/**
 * Call OSRM and get road distances for each leg of the shared route.
 * Returns array of leg distances in km, in order.
 */
async function fetchOsrmDistances(orderedStops) {
  const url = buildOsrmUrl(orderedStops);

  let response;
  try {
    response = await fetch(url);
  } catch (networkErr) {
    throw new Error(`OSRM_NETWORK_FAILURE: ${networkErr.message}`);
  }

  if (!response.ok) {
    throw new Error(`OSRM_HTTP_ERROR: ${response.status}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('OSRM_NO_ROUTE');
  }

  const route = data.routes[0];
  const expectedLegs = orderedStops.length - 1;
  if (route.legs.length !== expectedLegs) {
    throw new Error(`OSRM_LEG_MISMATCH: expected ${expectedLegs}, got ${route.legs.length}`);
  }

  const legDistances = route.legs.map(leg => leg.distance / 1000);
  const totalDistance = legDistances.reduce((sum, d) => sum + d, 0);

  return { legDistances, totalDistance };
}

/**
 * Main function called from trip.service.js
 *
 * Takes ordered stops and users, returns road-based distances for fare/ETA.
 * Handles all edge cases internally — caller always gets a valid result.
 */
async function getRoadDistances(orderedStops, users, haversineTotal) {
  const soloRoadDistances = getSoloRoadDistances(users);
  const totalSoloRoad = soloRoadDistances.reduce((sum, u) => sum + u.soloDistance, 0);
  const haversineFallbackTotal = haversineTotal * ROAD_TO_HAVERSINE_CORRECTION;

  let osrmResult;
  let usedFallback = false;

  try {
    osrmResult = await fetchOsrmDistances(orderedStops);

    if (osrmResult.totalDistance > haversineFallbackTotal * SANITY_MULTIPLIER) {
      console.warn(
        `[OSRM] Sanity check failed: ${osrmResult.totalDistance}km vs expected ~${haversineFallbackTotal}km. Using fallback.`
      );
      usedFallback = true;
    }
  } catch (err) {
    console.warn(`[OSRM] Failed (${err.message}). Using Haversine fallback.`);
    usedFallback = true;
  }

  if (usedFallback) {
    const haversineLegs = [];
    for (let i = 0; i < orderedStops.length - 1; i++) {
      haversineLegs.push(
        haversine(
          orderedStops[i].lat, orderedStops[i].lng,
          orderedStops[i + 1].lat, orderedStops[i + 1].lng
        ) * ROAD_TO_HAVERSINE_CORRECTION
      );
    }

    const roadDetourRatio = Math.max(
      0,
      (haversineFallbackTotal - totalSoloRoad) / totalSoloRoad
    );

    return {
      totalRoadDistanceKm: haversineFallbackTotal,
      legDistances: haversineLegs,
      soloRoadDistances,
      usedFallback: true,
      roadDetourRatio,
    };
  }

  const roadDetourRatio = Math.max(
    0,
    (osrmResult.totalDistance - totalSoloRoad) / totalSoloRoad
  );

  return {
    totalRoadDistanceKm: osrmResult.totalDistance,
    legDistances: osrmResult.legDistances,
    soloRoadDistances,
    usedFallback: false,
    roadDetourRatio,
  };
}

module.exports = {
  getRoadDistances,
  ROAD_DETOUR_THRESHOLD,
};
