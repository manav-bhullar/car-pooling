const { haversine } = require('./utils');

const MAX_GROUP_SIZE = 4;

function generateValidSequencesFast(users) {
  const userStops = users.map(u => ({
    pickup: { type: 'pickup', userId: u.id, lat: u.pickupLat, lng: u.pickupLng },
    drop:   { type: 'drop',   userId: u.id, lat: u.dropLat,   lng: u.dropLng },
  }));

  const totalStops = users.length * 2;
  const results = [];

  const pickedUp = new Array(users.length).fill(false);
  const droppedOff = new Array(users.length).fill(false);
  const current = new Array(totalStops);

  function backtrack(depth) {
    if (depth === totalStops) {
      results.push(current.slice()); // save a copy
      return;
    }

    for (let i = 0; i < users.length; i++) {
      if (!pickedUp[i]) {
        pickedUp[i] = true;
        current[depth] = userStops[i].pickup;
        backtrack(depth + 1);
        pickedUp[i] = false;
      } else if (!droppedOff[i]) {
        droppedOff[i] = true;
        current[depth] = userStops[i].drop;
        backtrack(depth + 1);
        droppedOff[i] = false;
      }
    }
  }

  backtrack(0);
  return results;
}

function optimizeRouteFast(users) {
  if (users.length > MAX_GROUP_SIZE) {
    throw new Error(`Group size ${users.length} exceeds MAX_GROUP_SIZE ${MAX_GROUP_SIZE}`);
  }

  const validSequences = generateValidSequencesFast(users);

  let bestDistance = Infinity;
  let bestSequence = null;

  const n = users.length;
  // Compute individual distances ahead of time
  let individual = 0;
  for (let i = 0; i < n; i++) {
    const u = users[i];
    individual += haversine(
      u.pickupLat,
      u.pickupLng,
      u.dropLat,
      u.dropLng
    );
  }

  for (let i = 0; i < validSequences.length; i++) {
    const seq = validSequences[i];

    // Instead of isConnectedGroup checking sequence array with findIndex,
    // let's just do it directly. Or pre-compute distances
  }
}
