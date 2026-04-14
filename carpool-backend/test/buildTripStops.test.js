const assert = require('assert');
const { buildTripStops } = require('../src/modules/trip/trip.utils');

function makeUser(i){
  return {
    userId: `user-${i}`,
    rideRequestId: `rr-${i}`,
    pickupLat: 40.0 + i*0.001,
    pickupLng: -74.0 - i*0.001,
    dropLat: 40.01 + i*0.001,
    dropLng: -74.01 - i*0.001,
  };
}

// Test: 2 users -> 4 stops
(function testTwoUsers(){
  const users = [makeUser(0), makeUser(1)];
  const ordered = [0,1,2,3];
  const stops = buildTripStops(users, ordered);
  assert.strictEqual(stops.length, 4, 'should produce 4 stops');
  assert.strictEqual(stops[0].segmentDistKm, 0, 'first segment dist should be 0');
  assert.strictEqual(stops[0].activePassengersOnSegment, 0);
  assert.strictEqual(stops[1].activePassengersOnSegment, 1);
  assert.strictEqual(stops[2].activePassengersOnSegment, 2);
  assert.strictEqual(stops[3].activePassengersOnSegment, 1);
  console.log('testTwoUsers ok');
})();

// Test: invalid orderedIndices length
(function testInvalidLength(){
  const users = [makeUser(0), makeUser(1)];
  try{
    buildTripStops(users, [0,1,2]);
    console.error('testInvalidLength failed: did not throw');
    process.exit(1);
  }catch(e){
    console.log('testInvalidLength ok');
  }
})();
