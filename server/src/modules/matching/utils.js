const EARTH_RADIUS_KM = 6371;

function toRad(deg){
    return (Math.PI*deg)/ 180.0;
}


function haversine(lat1, lng1, lat2, lng2) {
  // Guard: identical points
  if (lat1 === lat2 && lng1 === lng2) return 0;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function bearing(lat1, lng1, lat2, lng2) {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const x = Math.sin(Δλ) * Math.cos(φ2);
  const y =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(x, y); // radians

  // Convert to degrees and normalize to 0–360
  return (θ * 180 / Math.PI + 360) % 360;
}

module.exports = {
  haversine,
  bearing,
};