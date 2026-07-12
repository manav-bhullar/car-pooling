/**
 * Phase 5 Verification — Real-Time Driver Location via Redis
 *
 * Tests:
 * 1. Store driver location with TTL (simulates driverLocationUpdate)
 * 2. Retrieve cached location (simulates joinTrip replay + REST endpoint)
 * 3. Location TTL auto-expiry (simulates driver disconnect for >60s)
 * 4. Location overwrite on each update (latest always wins)
 * 5. Missing location returns null (driver hasn't moved yet)
 * 6. Bearing field preserved correctly
 */

require('dotenv').config();
const { connectRedis, getRedis, disconnectRedis } = require('../src/utils/redis');

const DRIVER_LOCATION_KEY = (tripId) => `driver:location:${tripId}`;
const DRIVER_LOCATION_TTL = 60;

const TRIP_ID = 'trip-loc-' + Date.now();

async function run() {
  const redis = connectRedis();
  await new Promise(r => setTimeout(r, 500));

  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) { console.log(`  ✅ ${label}`); passed++; }
    else           { console.log(`  ❌ FAIL: ${label}`); failed++; }
  }

  try {
    // ─── Test 1: Store driver location ───
    console.log('\n📍 Test 1: Store driver location in Redis');
    const loc1 = { lat: 28.6139, lng: 77.2090, bearing: 45, timestamp: Date.now() };
    await redis.set(DRIVER_LOCATION_KEY(TRIP_ID), JSON.stringify(loc1), 'EX', DRIVER_LOCATION_TTL);

    const stored = await redis.get(DRIVER_LOCATION_KEY(TRIP_ID));
    assert(stored !== null, 'Location key exists in Redis');
    const parsed = JSON.parse(stored);
    assert(parsed.lat === 28.6139, 'Latitude stored correctly');
    assert(parsed.lng === 77.2090, 'Longitude stored correctly');
    assert(parsed.bearing === 45, 'Bearing stored correctly');
    assert(typeof parsed.timestamp === 'number', 'Timestamp is a number');

    // Verify TTL is set
    const ttl = await redis.ttl(DRIVER_LOCATION_KEY(TRIP_ID));
    assert(ttl > 0 && ttl <= DRIVER_LOCATION_TTL, `TTL set correctly (${ttl}s ≤ ${DRIVER_LOCATION_TTL}s)`);

    // ─── Test 2: Retrieve for joinTrip replay ───
    console.log('\n🔄 Test 2: Retrieve cached location (joinTrip replay)');
    const cached = await redis.get(DRIVER_LOCATION_KEY(TRIP_ID));
    assert(cached !== null, 'Location exists for joinTrip replay');
    const replayed = JSON.parse(cached);
    assert(replayed.lat === loc1.lat, 'Replayed lat matches original');
    assert(replayed.lng === loc1.lng, 'Replayed lng matches original');

    // ─── Test 3: Location overwrite (latest always wins) ───
    console.log('\n🔃 Test 3: Location overwrite (each update replaces previous)');
    const loc2 = { lat: 28.6200, lng: 77.2150, bearing: 90, timestamp: Date.now() };
    await redis.set(DRIVER_LOCATION_KEY(TRIP_ID), JSON.stringify(loc2), 'EX', DRIVER_LOCATION_TTL);

    const updated = JSON.parse(await redis.get(DRIVER_LOCATION_KEY(TRIP_ID)));
    assert(updated.lat === 28.6200, 'Latest lat overwrites previous');
    assert(updated.bearing === 90, 'Latest bearing overwrites previous');
    assert(updated.lat !== loc1.lat, 'Old location is gone');

    // ─── Test 4: Missing location (driver hasn't moved yet) ───
    console.log('\n❓ Test 4: Missing location returns null');
    const missing = await redis.get(DRIVER_LOCATION_KEY('nonexistent-trip'));
    assert(missing === null, 'No location for unknown trip returns null');

    // ─── Test 5: Null bearing (optional field) ───
    console.log('\n🧭 Test 5: Optional bearing field (undefined → null-safe)');
    const locNoBearing = { lat: 28.6300, lng: 77.2200, bearing: undefined, timestamp: Date.now() };
    await redis.set(DRIVER_LOCATION_KEY(TRIP_ID), JSON.stringify(locNoBearing), 'EX', DRIVER_LOCATION_TTL);
    const noBearing = JSON.parse(await redis.get(DRIVER_LOCATION_KEY(TRIP_ID)));
    // undefined bearing gets serialized to null by JSON.stringify
    assert(noBearing.bearing === null || noBearing.bearing === undefined, 'Undefined bearing handled safely');

    // ─── Test 6: TTL auto-expiry ───
    console.log('\n⏱️  Test 6: TTL auto-expiry (2s TTL simulating 60s)');
    await redis.set(DRIVER_LOCATION_KEY('expire-test'), JSON.stringify(loc1), 'EX', 2);
    const before = await redis.get(DRIVER_LOCATION_KEY('expire-test'));
    assert(before !== null, 'Location exists before TTL expires');
    console.log('    Waiting 2.5s...');
    await new Promise(r => setTimeout(r, 2500));
    const after = await redis.get(DRIVER_LOCATION_KEY('expire-test'));
    assert(after === null, 'Location auto-cleared after TTL (simulates driver disconnect)');

    // Cleanup
    await redis.del(DRIVER_LOCATION_KEY(TRIP_ID));

  } catch (err) {
    console.error('\n💥 Test error:', err);
    failed++;
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('Phase 5 verification: ALL PASSED ✅');
  else              console.log('Phase 5 verification: SOME FAILED ❌');

  await disconnectRedis();
  process.exit(failed > 0 ? 1 : 0);
}

run();
