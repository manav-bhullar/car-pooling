const { haversine } = require("../matching/utils");

function buildTripStops(users, orderedIndices) {
  console.log("BUILD INPUT:", {
    users: users.map(u => ({ userId: u.userId, rideRequestId: u.rideRequestId })),
    orderedIndices,
  });

  if (!orderedIndices || orderedIndices.length === 0) {
    console.warn("buildTripStops called with empty orderedIndices");
  }

  if (orderedIndices && orderedIndices.length !== users.length * 2) {
    console.warn(`buildTripStops mismatch: orderedIndices.length=${orderedIndices.length}, expected=${users.length * 2}`);
  }

  const n = users.length;

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