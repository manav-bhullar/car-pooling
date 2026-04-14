const { haversine } = require("../matching/utils");

function buildTripStops(users, orderedIndices) {
  // Input validation performed above; avoid noisy logs in scheduler

  if (!orderedIndices || orderedIndices.length === 0) {
    throw new Error("Invalid route: orderedIndices missing or empty");
  }

  if (orderedIndices.length !== users.length * 2) {
    throw new Error(`Invalid route: incorrect number of stops. orderedIndices.length=${orderedIndices.length}, expected=${users.length * 2}`);
  }

  const n = users.length;
  const maxIndex = users.length * 2 - 1;

for (const idx of orderedIndices) {
  if (idx < 0 || idx > maxIndex) {
    throw new Error(`Invalid route: index out of bounds (${idx})`);
  }
}
  const coords = [
    ...users.map(u => [u.pickupLat, u.pickupLng]),
    ...users.map(u => [u.dropLat, u.dropLng]),
  ];

  const active = new Set();
  const stops = [];

  let prev = null;

  for (let i = 0; i < orderedIndices.length; i++) {
    const idx = orderedIndices[i];
    const [lat, lng] = coords[idx];

    const segmentDistKm = prev
      ? haversine(prev[0], prev[1], lat, lng)
      : 0;

    const activePassengers = active.size;

    let type, rideRequestId;

    if (idx < n) {
      type = "PICKUP";
      rideRequestId = users[idx].rideRequestId;
      active.add(idx);
    } else {
      type = "DROPOFF";
      const userIdx = idx - n;
      rideRequestId = users[userIdx].rideRequestId;
      active.delete(userIdx);
    }

    stops.push({
      stopOrder: i,
      type,
      lat,
      lng,
      rideRequestId,
      segmentDistKm,
      activePassengersOnSegment: activePassengers,
    });

    prev = [lat, lng];
  }

  return stops;
}

module.exports = { buildTripStops };