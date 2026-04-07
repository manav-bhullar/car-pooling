// src/modules/matching/scoring.js

const { haversine, bearing } = require('./utils');
const { directionCompatible } = require('./direction');
const { fastDetourEstimate } = require('./detour');

// CONFIG (temporary — we’ll centralize later)
const MAX_PICKUP_KM = 2;
const MAX_DROP_KM = 3;
const MAX_TIME_DIFF = 15; // minutes
const MAX_DETOUR = 0.30;
const MAX_DIR_DIFF = 60;

/**
 * Returns score (0–1) or null if rejected
 */
function scorePair(a, b) {
  // --- HARD FILTER 1: direction ---
  if (!directionCompatible(a, b)) {
    console.log(`[SCORE] Pair ${a.id}+${b.id} rejected: direction incompatible`);
    return null;
  }

  // --- HARD FILTER 2: detour ---
  const detourRatio = fastDetourEstimate(a, b);
  if (detourRatio > MAX_DETOUR) {
    console.log(`[SCORE] Pair ${a.id}+${b.id} rejected: detour ${detourRatio} > ${MAX_DETOUR}`);
    return null;
  }

  // --- DETOUR SCORE ---
  const detourScore = 1 - (detourRatio / MAX_DETOUR);

  // --- PICKUP SCORE ---
  const pickupDist = haversine(
    a.pickupLat, a.pickupLng,
    b.pickupLat, b.pickupLng
  );
  const pickupScore = Math.max(0, 1 - (pickupDist / MAX_PICKUP_KM));

  // --- DROP SCORE ---
  const dropDist = haversine(
    a.dropLat, a.dropLng,
    b.dropLat, b.dropLng
  );
  const dropScore = Math.max(0, 1 - (dropDist / MAX_DROP_KM));

  // --- TIME SCORE ---
  const timeDiff =
    Math.abs(new Date(a.preferredTime) - new Date(b.preferredTime)) / (1000 * 60);

  const timeScore = Math.max(0, 1 - (timeDiff / MAX_TIME_DIFF));

  // --- DIRECTION SCORE (soft component) ---
  const bA = bearing(a.pickupLat, a.pickupLng, a.dropLat, a.dropLng);
  const bB = bearing(b.pickupLat, b.pickupLng, b.dropLat, b.dropLng);

  let diff = Math.abs(bA - bB);
  if (diff > 180) diff = 360 - diff;

  const directionScore = Math.max(0, 1 - (diff / MAX_DIR_DIFF));

  // --- FINAL WEIGHTED SCORE ---
  const finalScore = (
    0.25 * pickupScore +
    0.20 * dropScore +
    0.30 * detourScore +
    0.15 * timeScore +
    0.10 * directionScore
  );

  console.log(`[SCORE] Pair ${a.id}+${b.id} = ${finalScore.toFixed(3)}`);

  return finalScore;
}

module.exports = {
  scorePair,
};