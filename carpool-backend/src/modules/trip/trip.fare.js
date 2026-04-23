const FARE_PER_KM = 12;
const MIN_FARE = 20;

/**
 * @param {Array<{ rideRequestId: string }>} users
 * @param {Array<{ segmentDistKm: number, activePassengersOnSegment: number, type: string, rideRequestId: string, stopOrder?: number }>} stops
 * @returns {Object<string, number>} fare by rideRequestId
 */
function calculateFares(users, stops) {
  if (!stops || stops.length === 0) {
    throw new Error('No stops provided for fare calculation');
  }

  const fareMap = {};
  for (const user of users) {
    if (!user || !user.rideRequestId) {
      console.warn('Skipping invalid user without rideRequestId', user);
      continue;
    }
    fareMap[user.rideRequestId] = 0;
  }

  const active = new Set();

  for (const stop of stops) {
    if (!stop || typeof stop.segmentDistKm !== 'number' || typeof stop.activePassengersOnSegment !== 'number') {
      console.warn('Skipping invalid stop with missing required fields', stop);
      continue;
    }

    const segDist = stop.segmentDistKm;
    const passengers = stop.activePassengersOnSegment;
    const activeCount = active.size;

    if (activeCount !== passengers) {
      console.warn(
        `Active passenger mismatch at stopOrder=${stop.stopOrder}: runtime=${activeCount} stored=${passengers}`
      );
    }

    if (segDist > 0 && passengers > 0 && activeCount > 0) {
      const segmentCost = segDist * FARE_PER_KM;
      const perPerson = segmentCost / passengers;

      for (const rid of active) {
        if (!(rid in fareMap)) {
          console.warn('Unknown rideRequestId in active set, skipping fare allocation', rid);
          continue;
        }
        fareMap[rid] += perPerson;
      }
    }

    if (stop.type === 'PICKUP') {
      active.add(stop.rideRequestId);
    } else if (stop.type === 'DROPOFF') {
      active.delete(stop.rideRequestId);
    } else {
      console.warn(`Invalid stop type at stopOrder=${stop.stopOrder}: ${stop.type}`);
    }
  }

  Object.keys(fareMap).forEach((rid) => {
    fareMap[rid] = Math.max(Math.round((fareMap[rid] + Number.EPSILON) * 100) / 100, MIN_FARE);
  });

  return fareMap;
}

module.exports = {
  calculateFares,
};