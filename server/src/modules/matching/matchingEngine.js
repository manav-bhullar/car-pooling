const { scorePair } = require('./scoring');
const { optimizeRoute, MAX_GROUP_SIZE } = require('./route');

const MAX_USER_DETOUR = 0.30;

/**
 * Step 1: Generate all valid pairs
 */
function generatePairs(requests) {
  const pairs = [];

  for (let i = 0; i < requests.length; i++) {
    for (let j = i + 1; j < requests.length; j++) {
      const a = requests[i];
      const b = requests[j];

      const score = scorePair(a, b);

      // Validate score is a number (not null, NaN, or Infinity)
      if (score !== null && Number.isFinite(score)) {
        pairs.push({
          users: [a, b],
          score,
        });
      }
    }
  }

  return pairs.sort((a, b) => b.score - a.score);
}

/**
 * Step 2: Try to expand group by one user
 * Works for any input size: pair→3, group of 3→4, etc.
 */
function tryFormGroup(pair, allRequests, usedIds) {
  // Defensive copy of pair to prevent mutation
  let bestGroup = {
    users: pair.users,
    score: pair.score,
  };

  for (const candidate of allRequests) {
    if (usedIds.has(candidate.id)) continue;
    if (pair.users.some(u => u.id === candidate.id)) continue;

    const groupUsers = [...pair.users, candidate];

    // Step A: Check all pair combinations inside group
    let valid = true;
    let totalScore = 0;

    for (let i = 0; i < groupUsers.length; i++) {
      for (let j = i + 1; j < groupUsers.length; j++) {
        const s = scorePair(groupUsers[i], groupUsers[j]);
        if (s === null) {
          valid = false;
          break;
        }
        totalScore += s;
      }
      if (!valid) break;
    }

    if (!valid) continue;

    // Step B: Route validation (CRITICAL)
    const route = optimizeRoute(groupUsers);

    if (!route || !route.sequence) continue;

    if (route.maxUserDetour > MAX_USER_DETOUR) {
      continue; // reject bad group
    }

    // Step C: Accept better group
    if (totalScore > bestGroup.score) {
      bestGroup = {
        users: groupUsers,
        score: totalScore,
        route,
      };
    }
  }

  return bestGroup;
}

/**
 * Transform match output to required format
 * match = { users: [{userId, rideRequestId}, ...], route: {...}, detourRatio: ... }
 */
function transformMatchOutput(rawMatch) {
  // Transform users array and include coordinates so downstream
  // code (buildTripStops) can compute distances correctly.
  const users = rawMatch.users.map(request => ({
    userId: request.userId,
    rideRequestId: request.id,
    pickupLat: request.pickupLat,
    pickupLng: request.pickupLng,
    dropLat: request.dropLat,
    dropLng: request.dropLng,
  }));

  // debug logs removed - transformMatchOutput is now silent in production

  // Transform route sequence: replace userId with rideRequestId
  const sequence = rawMatch.route.sequence.map(stop => {
    // Find the request with this userId to get rideRequestId
    const request = rawMatch.users.find(u => u.id === stop.userId);
    
    return {
      type: stop.type,
      lat: stop.lat,
      lng: stop.lng,
      rideRequestId: request ? request.id : stop.userId,
      segmentDistKm: stop.segmentDistKm || 0,
      activePassengers: stop.activePassengers || 0,
    };
  });

  return {
    users,
    route: {
      totalDistance: rawMatch.route.totalDistance,
      sequence: rawMatch.route.sequence,
      orderedIndices: rawMatch.route.orderedIndices,
    },
    detourRatio: rawMatch.route.detourRatio,
  };
}

/**
 * Step 3: Main matching function
 */
function runMatchingBatch(requests) {
  const results = [];
  const usedIds = new Set();

  const pairs = generatePairs(requests);

  for (const pair of pairs) {
    const [a, b] = pair.users;

    if (usedIds.has(a.id) || usedIds.has(b.id)) continue;

    // Try forming group (pair → 3)
    let best = tryFormGroup(pair, requests, usedIds);

    // Try expanding further (3 → 4) if below MAX_GROUP_SIZE
    if (best.users.length > 2 && best.users.length < MAX_GROUP_SIZE) {
      const expanded = tryFormGroup(best, requests, usedIds);
      // Only take the expansion if it actually grew
      if (expanded.users.length > best.users.length) {
        best = expanded;
      }
    }

    // Reject any group that didn't reach the minimum threshold of 3 riders
    if (best.users.length < 3) {
      continue; // reject groups smaller than 3
    }

    // Ensure score is always valid (not null, NaN, or Infinity)
    if (!Number.isFinite(best.score)) {
      continue;
    }

    // Mark users as used
    best.users.forEach(u => usedIds.add(u.id));

    // Transform to required output format before returning
    const transformedMatch = transformMatchOutput(best);
    results.push(transformedMatch);
  }

  return results;
}

module.exports = {
  runMatchingBatch,
  transformMatchOutput,
};