// src/modules/matching/route.js

const { haversine } = require('./utils');

const MAX_GROUP_SIZE = 4;

/**
 * Generate all valid stop orderings using backtracking.
 * Only produces sequences where pickup comes before drop for each user.
 *
 * Search space: (2n)! / 2^n instead of (2n)!
 *   2 riders: 6 sequences (vs 24)
 *   3 riders: 90 sequences (vs 720)
 *   4 riders: 2,520 sequences (vs 40,320)
 */
function generateValidSequences(users) {
  // Pre-build stop objects for each user (avoids creating them inside recursion)
  const userStops = users.map(u => ({
    pickup: { type: 'pickup', userId: u.id, lat: u.pickupLat, lng: u.pickupLng },
    drop:   { type: 'drop',   userId: u.id, lat: u.dropLat,   lng: u.dropLng },
  }));

  const totalStops = users.length * 2;
  const results = [];

  // State tracking: arrays for performance (faster than Sets in tight recursion)
  const pickedUp = new Array(users.length).fill(false);
  const droppedOff = new Array(users.length).fill(false);

  // Current sequence being built (reused, not re-allocated)
  const current = [];

  function backtrack() {
    if (current.length === totalStops) {
      results.push([...current]); // save a copy
      return;
    }

    for (let i = 0; i < users.length; i++) {
      if (!pickedUp[i]) {
        // Option: pick up user i
        pickedUp[i] = true;
        current.push(userStops[i].pickup);
        backtrack();
        current.pop();
        pickedUp[i] = false;

      } else if (!droppedOff[i]) {
        // Option: drop off user i (already picked up)
        droppedOff[i] = true;
        current.push(userStops[i].drop);
        backtrack();
        current.pop();
        droppedOff[i] = false;
      }
      // If both pickedUp AND droppedOff → skip (user fully processed)
    }
  }

  backtrack();
  return results;
}

/**
 * Check if group is connected
 * Every user must overlap with at least one other user in the ride
 */
function isConnectedGroup(users, sequence) {
  const ranges = users.map(u => {
    const pickupIdx = sequence.findIndex(
      s => s.userId === u.id && s.type === "pickup"
    );

    const dropIdx = sequence.findIndex(
      s => s.userId === u.id && s.type === "drop"
    );

    return {
      userId: u.id,
      pickupIdx,
      dropIdx,
    };
  });

  for (const user of ranges) {
    const hasOverlap = ranges.some(other => {
      if (other.userId === user.userId) return false;

      return (
        user.pickupIdx < other.dropIdx &&
        other.pickupIdx < user.dropIdx
      );
    });

    if (!hasOverlap) return false;
  }

  return true;
}

/**
 * Calculate total route distance
 */
function calculateDistance(sequence) {
  let total = 0;

  for (let i = 0; i < sequence.length - 1; i++) {
    const a = sequence[i];
    const b = sequence[i + 1];

    total += haversine(a.lat, a.lng, b.lat, b.lng);
  }

  return total;
}

/**
 * Calculate route distance between two indices in sequence
 */
function calculateSegmentDistance(sequence, startIdx, endIdx) {
  let dist = 0;

  for (let i = startIdx; i < endIdx; i++) {
    const a = sequence[i];
    const b = sequence[i + 1];

    dist += haversine(a.lat, a.lng, b.lat, b.lng);
  }

  return dist;
}

/**
 * Compute per-user detour in optimized sequence
 * Returns maximum detour ratio experienced by any user
 */
function computePerUserDetour(users, sequence) {
  if (!sequence || sequence.length === 0) {
    return Infinity;
  }

  let maxDetour = 0;

  for (const user of users) {
    const pickupIdx = sequence.findIndex(
      s => s.userId === user.id && s.type === "pickup"
    );

    const dropIdx = sequence.findIndex(
      s => s.userId === user.id && s.type === "drop"
    );

    // Skip if pickup/drop not found (shouldn't happen)
    if (pickupIdx === -1 || dropIdx === -1) continue;

    const experienced = calculateSegmentDistance(sequence, pickupIdx, dropIdx);

    const solo = haversine(
      user.pickupLat,
      user.pickupLng,
      user.dropLat,
      user.dropLng
    );

    const detour =
      solo === 0 ? 0 : Math.max(0, (experienced - solo) / solo);

    if (detour > maxDetour) {
      maxDetour = detour;
    }
  }

  return maxDetour;
}

/**
 * Build stops from users
 */
function buildStops(users) {
  const stops = [];

  for (const u of users) {
    stops.push({
      type: "pickup",
      userId: u.id,
      lat: u.pickupLat,
      lng: u.pickupLng,
    });

    stops.push({
      type: "drop",
      userId: u.id,
      lat: u.dropLat,
      lng: u.dropLng,
    });
  }

  return stops;
}

/**
 * Optimize route for given users
 * Returns best sequence + distance + detour
 */
function optimizeRoute(users) {
  if (users.length > MAX_GROUP_SIZE) {
    throw new Error(`Group size ${users.length} exceeds MAX_GROUP_SIZE ${MAX_GROUP_SIZE}`);
  }

  const validSequences = generateValidSequences(users);

  let bestDistance = Infinity;
  let bestSequence = null;

  for (const seq of validSequences) {
    // No isValidSequence check needed — all sequences are valid by construction

    if (!isConnectedGroup(users, seq)) continue;

    const dist = calculateDistance(seq);

    if (dist < bestDistance) {
      bestDistance = dist;
      bestSequence = seq;
    }
  }

  if (!bestSequence) {
    return null;
  }

  // Compute individual distances
  let individual = 0;
  for (const u of users) {
    individual += haversine(
      u.pickupLat,
      u.pickupLng,
      u.dropLat,
      u.dropLng
    );
  }

  const detourRatio =
    individual === 0
      ? 0
      : Math.max(0, (bestDistance - individual) / individual);

  const maxUserDetour = computePerUserDetour(users, bestSequence);

  /**
   * Convert sequence of stops back to orderedIndices
   * Indices: 0..n-1 = pickups, n..2n-1 = dropoffs
   */
  const n = users.length;
  const userToIndex = {};
  users.forEach((u, idx) => {
    userToIndex[u.id] = idx;
  });

  const orderedIndices = bestSequence.map(stop => {
    const userIdx = userToIndex[stop.userId];
    if (stop.type === 'pickup') {
      return userIdx; // 0..n-1
    } else {
      return n + userIdx; // n..2n-1
    }
  });

  return {
    sequence: bestSequence,
    orderedIndices,
    totalDistance: bestDistance,
    detourRatio,
    maxUserDetour,
  };
}



module.exports = {
  optimizeRoute,
  computePerUserDetour,
  calculateSegmentDistance,
  isConnectedGroup,
  MAX_GROUP_SIZE,
};