/**
 * Single source of truth for UI state derivation.
 * Never compute UI state inside components.
 */
export function deriveUIState(rideRequest, trip) {
  // Terminal state: if a trip is explicitly completed, surface TRIP_COMPLETED
  if (trip && trip.status === 'COMPLETED') {
    return 'TRIP_COMPLETED';
  }

  // Terminal state: explicit ride request cancellation
  if (rideRequest && rideRequest.status === 'CANCELLED') {
    return 'CANCELLED';
  }

  // No source state at all -> IDLE
  if (!rideRequest && !trip) {
    return 'IDLE';
  }

  // Pending ride request -> PENDING
  if (rideRequest && rideRequest.status === 'PENDING') {
    return 'PENDING';
  }

  // Matched transition: matched but trip may not yet be loaded.
  // This must return MATCHED as a transition state to avoid blank-screen flashes
  // while the trip fetch is in-flight.
  if (rideRequest && rideRequest.status === 'RIDERS_MATCHED') {
    if (!trip) {
      return 'MATCHED';
    }

    // Trip exists and we can inspect its status deterministically
    if (['RIDERS_MATCHED', 'DRIVER_MATCHED', 'STARTED'].includes(trip.status)) return 'TRIP_ACTIVE';
    if (trip.status === 'COMPLETED') return 'TRIP_COMPLETED';
    if (trip.status === 'CANCELLED') return 'REQUEUED';

    // Unknown or transitional trip state: remain in MATCHED transition
    return 'MATCHED';
  }

  // If we have a trip but no rideRequest, infer UI from trip status
  if (trip) {
    if (['RIDERS_MATCHED', 'DRIVER_MATCHED', 'STARTED'].includes(trip.status)) return 'TRIP_ACTIVE';
    if (trip.status === 'COMPLETED') return 'TRIP_COMPLETED';
  }

  // Default fallback
  return 'IDLE';
}

/**
 * Find the trip where current user is a passenger
 */
export function findUserTrip(trips, userId) {
  if (!trips || !userId) return null;

  return (
    trips.find(t =>
      t.passengers?.some(p => p.userId === userId)
    ) || null
  );
}