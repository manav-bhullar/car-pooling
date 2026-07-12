/**
 * Phase 4 Verification — Hot Query Caching
 *
 * Tests:
 * 1. cacheGet / cacheSet / cacheDel basics
 * 2. TTL auto-expiry
 * 3. Caching null values (no active request)
 * 4. invalidateTripCaches removes correct keys
 * 5. invalidateUserRideCaches removes correct keys
 * 6. Cache-aside pattern (miss → DB → set → hit)
 */

require('dotenv').config();
const { connectRedis, getRedis, disconnectRedis } = require('../src/utils/redis');
const {
  cacheGet, cacheSet, cacheDel,
  invalidateTripCaches, invalidateUserRideCaches,
  CACHE_AVAILABLE_TRIPS_KEY, CACHE_TRIP_KEY,
  CACHE_CURRENT_TRIP_KEY, CACHE_CURRENT_RIDE_KEY,
} = require('../src/utils/cache');

const USER_A = 'user-a-' + Date.now();
const USER_B = 'user-b-' + Date.now();
const TRIP_ID = 'trip-' + Date.now();

async function run() {
  connectRedis();
  await new Promise(r => setTimeout(r, 500));

  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) { console.log(`  ✅ ${label}`); passed++; }
    else           { console.log(`  ❌ FAIL: ${label}`); failed++; }
  }

  try {
    // ─── Test 1: cacheGet / cacheSet / cacheDel basics ───
    console.log('\n📦 Test 1: cacheGet / cacheSet / cacheDel basics');
    await cacheSet('test:phase4:basic', { hello: 'redis' }, 60);
    const got = await cacheGet('test:phase4:basic');
    assert(got !== null, 'cacheGet returns data after cacheSet');
    assert(got.hello === 'redis', 'Cached value deserialized correctly');

    await cacheDel('test:phase4:basic');
    const gone = await cacheGet('test:phase4:basic');
    assert(gone === null, 'cacheDel removes key');

    // ─── Test 2: TTL auto-expiry ───
    console.log('\n⏱️  Test 2: TTL auto-expiry (2s)');
    await cacheSet('test:phase4:ttl', { data: 'expires' }, 2);
    const before = await cacheGet('test:phase4:ttl');
    assert(before !== null, 'Key exists before TTL');
    console.log('    Waiting 2.5s...');
    await new Promise(r => setTimeout(r, 2500));
    const after = await cacheGet('test:phase4:ttl');
    assert(after === null, 'Key auto-expired after TTL');

    // ─── Test 3: Caching null values ───
    console.log('\n🔍 Test 3: Caching null values (no active request)');
    await cacheSet(CACHE_CURRENT_RIDE_KEY(USER_A), null, 15);
    const nullVal = await cacheGet(CACHE_CURRENT_RIDE_KEY(USER_A));
    // null stored as JSON "null" and parsed back to null
    assert(nullVal === null, 'Cached null returns null on get');
    // Verify the key actually EXISTS in Redis (not just missing)
    const redis = getRedis();
    const rawExists = await redis.exists(CACHE_CURRENT_RIDE_KEY(USER_A));
    assert(rawExists === 1, 'Null-valued key physically exists in Redis');
    await cacheDel(CACHE_CURRENT_RIDE_KEY(USER_A));

    // ─── Test 4: invalidateTripCaches ───
    console.log('\n🗑️  Test 4: invalidateTripCaches removes correct keys');
    // Seed the keys that would normally exist for an active trip
    await cacheSet(CACHE_AVAILABLE_TRIPS_KEY(), [{ id: TRIP_ID }], 60);
    await cacheSet(CACHE_TRIP_KEY(TRIP_ID), { id: TRIP_ID, status: 'RIDERS_MATCHED' }, 60);
    await cacheSet(CACHE_CURRENT_TRIP_KEY(USER_A), { id: TRIP_ID }, 60);
    await cacheSet(CACHE_CURRENT_TRIP_KEY(USER_B), { id: TRIP_ID }, 60);
    await cacheSet(CACHE_CURRENT_RIDE_KEY(USER_A), { status: 'RIDERS_MATCHED' }, 60);
    await cacheSet(CACHE_CURRENT_RIDE_KEY(USER_B), { status: 'RIDERS_MATCHED' }, 60);

    await invalidateTripCaches(TRIP_ID, [USER_A, USER_B]);

    assert(await cacheGet(CACHE_AVAILABLE_TRIPS_KEY()) === null, 'available_trips cache cleared');
    assert(await cacheGet(CACHE_TRIP_KEY(TRIP_ID)) === null, 'trip:{id} cache cleared');
    assert(await cacheGet(CACHE_CURRENT_TRIP_KEY(USER_A)) === null, 'current_trip:userA cleared');
    assert(await cacheGet(CACHE_CURRENT_TRIP_KEY(USER_B)) === null, 'current_trip:userB cleared');
    assert(await cacheGet(CACHE_CURRENT_RIDE_KEY(USER_A)) === null, 'current_ride:userA cleared');
    assert(await cacheGet(CACHE_CURRENT_RIDE_KEY(USER_B)) === null, 'current_ride:userB cleared');

    // ─── Test 5: invalidateUserRideCaches ───
    console.log('\n🗑️  Test 5: invalidateUserRideCaches removes correct keys');
    await cacheSet(CACHE_CURRENT_RIDE_KEY(USER_A), { status: 'PENDING' }, 60);
    await cacheSet(CACHE_CURRENT_TRIP_KEY(USER_A), { status: 'RIDERS_MATCHED' }, 60);

    await invalidateUserRideCaches(USER_A);

    assert(await cacheGet(CACHE_CURRENT_RIDE_KEY(USER_A)) === null, 'current_ride cleared');
    assert(await cacheGet(CACHE_CURRENT_TRIP_KEY(USER_A)) === null, 'current_trip cleared');

    // ─── Test 6: Cache-aside pattern ───
    console.log('\n🔄 Test 6: Cache-aside (miss → set → hit)');
    const key = CACHE_TRIP_KEY('fake-trip');

    // Miss
    const miss = await cacheGet(key);
    assert(miss === null, 'Cache miss returns null');

    // Set (simulates what the service does after a DB query)
    const fakeTrip = { id: 'fake-trip', status: 'STARTED', tripUsers: [] };
    await cacheSet(key, fakeTrip, 30);

    // Hit
    const hit = await cacheGet(key);
    assert(hit !== null, 'Cache hit returns data');
    assert(hit.status === 'STARTED', 'Cached trip has correct status');

    // Verify TTL is set
    const ttl = await redis.ttl(key);
    assert(ttl > 0 && ttl <= 30, `TTL is set correctly (${ttl}s)`);

    await cacheDel(key);

  } catch (err) {
    console.error('\n💥 Test error:', err);
    failed++;
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('Phase 4 verification: ALL PASSED ✅');
  else              console.log('Phase 4 verification: SOME FAILED ❌');

  await disconnectRedis();
  process.exit(failed > 0 ? 1 : 0);
}

run();
