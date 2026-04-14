// src/modules/matching/route.js

const { haversine } = require('./utils');

/**
 * Generate all permutations of array
 */
function permute(arr) {
  if (arr.length <= 1) return [arr];

  const result = [];

  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    const perms = permute(rest);

    for (const p of perms) {
      result.push([arr[i], ...p]);
    }
  }

  return result;
}

/**
 * Check if sequence is valid
 * Ensures pickup comes before drop for each user
 */
function isValidSequence(sequence) {
  const picked = new Set();

  for (const stop of sequence) {
    if (stop.type === "pickup") {
      picked.add(stop.userId);
    }

    if (stop.type === "drop") {
      if (!picked.has(stop.userId)) {
        return false;
      }
    }
  }

  return true;
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
  const stops = buildStops(users);

  const allPerms = permute(stops);

  let bestDistance = Infinity;
  let bestSequence = null;

  for (const seq of allPerms) {
    if (!isValidSequence(seq)) continue;

    if (!isConnectedGroup(users, seq)) continue;

    const dist = calculateDistance(seq);

    if (dist < bestDistance) {
      bestDistance = dist;
      bestSequence = seq;
    }
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
};