/**
 * Single source of truth for UI state derivation.
 * Never compute UI state inside components.
 */
export function deriveUIState(rideRequest, trip) {
  if (!rideRequest || rideRequest.status === 'CANCELLED') {
    return 'IDLE';
  }

  if (rideRequest.status === 'PENDING') {
    return 'PENDING';
  }

  if (rideRequest.status === 'MATCHED') {
    if (!trip) return 'MATCHED';

    if (trip.status === 'ACTIVE') return 'MATCHED';
    if (trip.status === 'COMPLETED') return 'COMPLETED';

    // Important edge case:
    // Trip got cancelled due to co-rider cancel
    if (trip.status === 'CANCELLED') return 'REQUEUED';
  }

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