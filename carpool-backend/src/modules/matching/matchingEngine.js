const { scorePair } = require('./scoring');
const { optimizeRoute } = require('./route');

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
 * Step 2: Try to expand pair into group (3 users)
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
    let totalScore = pair.score;

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
  // Transform users array
  const users = rawMatch.users.map(request => ({
    userId: request.userId,
    rideRequestId: request.id,
  }));

  console.log("transformMatchOutput RAW ROUTE:", rawMatch.route);
  console.log("transformMatchOutput orderedIndices:", rawMatch.route ? rawMatch.route.orderedIndices : undefined);

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

    // Try forming group
    const best = tryFormGroup(pair, requests, usedIds);

    // Final validation for pair fallback
    if (best.users.length === 2) {
      const route = optimizeRoute(best.users);

      if (!route || route.maxUserDetour > MAX_USER_DETOUR) {
        continue; // reject pair
      }

      // Explicitly preserve score and add route
      best.route = route;
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