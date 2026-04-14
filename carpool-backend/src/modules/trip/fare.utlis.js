const DEFAULT_FARE_PER_KM = 12;
const DEFAULT_MIN_FARE = 20;

/**
 * Calculate per-ride fares from trip users and ordered trip stops.
 * - `users` must be an array of objects containing `rideRequestId`.
 * - `stops` must be the ordered array of TripStop rows where
 *   `segmentDistKm` is the distance from previous stop and
 *   `type` is 'PICKUP' or 'DROPOFF'.
 */
function calculateFares(users, stops, options = {}) {
    const farePerKm = options.farePerKm ?? DEFAULT_FARE_PER_KM;
    const minFare = options.minFare ?? DEFAULT_MIN_FARE;

    // Initialize fares map keyed by rideRequestId
    const fares = {};
    for (const u of users) {
        if (!u || !u.rideRequestId) throw new Error('Each user must include rideRequestId');
        fares[u.rideRequestId] = 0;
    }

    // Active set of rideRequestIds on the vehicle BEFORE applying the current stop.
    const active = new Set();

    for (const stop of stops) {
        // Strict schema expectations: fields must exist and be correct types
        if (typeof stop.segmentDistKm !== 'number') {
            throw new Error(`Invalid TripStop: segmentDistKm missing or not a number at stopOrder=${stop.stopOrder}`);
        }
        if (typeof stop.activePassengersOnSegment !== 'number') {
            throw new Error(`Invalid TripStop: activePassengersOnSegment missing or not a number at stopOrder=${stop.stopOrder}`);
        }

        const segmentDistKm = stop.segmentDistKm;
        const storedActiveCount = stop.activePassengersOnSegment;

        // Sanity: runtime active set must match stored active count
        const activeList = Array.from(active);
        if (activeList.length !== storedActiveCount) {
            throw new Error(`Active set mismatch at stopOrder=${stop.stopOrder}: runtime=${activeList.length} stored=${storedActiveCount}`);
        }

        if (segmentDistKm > 0 && storedActiveCount > 0) {
            const segmentCost = segmentDistKm * farePerKm;
            const perUser = segmentCost / storedActiveCount;
            for (const rid of activeList) {
                // Must exist in fares map (input users must cover all rideRequestIds)
                if (!(rid in fares)) {
                    throw new Error(`Unknown rideRequestId in active set: ${rid}`);
                }
                fares[rid] += perUser;
            }
        }

        // Update active set AFTER allocating this segment
        const t = stop.type;
        const rid = stop.rideRequestId;
        if (t === 'PICKUP') {
            active.add(rid);
        } else if (t === 'DROPOFF' || t === 'DROP') {
            active.delete(rid);
        } else {
            throw new Error(`Invalid stop type at stopOrder=${stop.stopOrder}: ${t}`);
        }
    }

    // Enforce minimum fare and round to 2 decimals
    for (const rid of Object.keys(fares)) {
        fares[rid] = Math.max(minFare, Math.round((fares[rid] + Number.EPSILON) * 100) / 100);
    }

    return fares;
}

module.exports = { calculateFares };