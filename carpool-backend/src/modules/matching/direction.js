const {bearing} = require('./utils');

const MAX_DIRECTION_DIFF = 60;

/**
 * Determines if two ride requests are direction-compatible
 * @param {Object} a - ride request A
 * @param {Object} b - ride request B
 * @returns {boolean}
 */

function directionCompatible(a, b) {
    const bearingA = bearing(
        a.pickupLat,
        a.pickupLng,
        a.dropLat,
        a.dropLng
    );

    const bearingB = bearing(
        b.pickupLat,
        b.pickupLng,
        b.dropLat,
        b.dropLng
    );

    let diff = Math.abs(bearingA - bearingB);
    
    if(diff > 180){
        diff = 360 - diff;
    }

    return diff <= MAX_DIRECTION_DIFF;
}

module.exports = {
    directionCompatible
}