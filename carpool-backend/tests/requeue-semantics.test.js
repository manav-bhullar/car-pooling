const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

/**
 * Test: Requeue Semantics - Response Enrichment
 *
 * Validates that getRideRequests() correctly enriches responses with:
 * - requeued: boolean
 * - requeueReason: 'CO_RIDER_CANCELLED' | null
 *
 * Coverage:
 * 1. Fresh PENDING request → requeued=false
 * 2. Requeued rider (after cascade) → requeued=true
 * 3. MATCHED request → requeued=false, no metadata pollution
 * 4. CANCELLED-by-self → requeued=false
 * 5. No N+1 queries on enrichment
 */

async function runRequeueSemanticsTest() {
  console.log('\n🧪 TEST: Requeue Semantics - Response Enrichment\n');

  try {
    // ========== SETUP ==========
    console.log('📋 SETUP: Fetching test users...');
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'dave@test.com']
        }
      }
    });

    const USERS = {
      alice: users.find(u => u.email === 'alice@test.com')?.id,
      bob: users.find(u => u.email === 'bob@test.com')?.id,
      charlie: users.find(u => u.email === 'charlie@test.com')?.id,
      dave: users.find(u => u.email === 'dave@test.com')?.id,
    };

    if (!USERS.alice || !USERS.bob || !USERS.charlie || !USERS.dave) {
      throw new Error('Could not find test users');
    }
    console.log('  ✅ Found 4 users\n');

    // ========== TEST 1: Fresh PENDING → requeued=false ==========
    console.log('🧪 TEST 1: Fresh PENDING request should have requeued=false');
    const freshReqRes = await axios.post(`${BASE_URL}/ride-requests`, {
      pickupLat: 30.35,
      pickupLng: 76.36,
      dropLat: 30.69,
      dropLng: 76.86,
      preferredTime: new Date(Date.now() + 86400000).toISOString(),
    }, {
      headers: { 'X-User-ID': USERS.alice }
    });

    const freshReqId = freshReqRes.data.data.id;

    const freshFetchRes = await axios.get(`${BASE_URL}/ride-requests`, {
      headers: { 'X-User-ID': USERS.alice },
      params: { status: 'PENDING' }
    });

    const freshRequest = freshFetchRes.data.data.find(r => r.id === freshReqId);
    const test1Checks = [
      {
        name: 'Fresh request has requeued=false',
        condition: freshRequest.requeued === false,
        actual: freshRequest.requeued
      },
      {
        name: 'Fresh request has requeueReason=null',
        condition: freshRequest.requeueReason === null,
        actual: freshRequest.requeueReason
      }
    ];

    let test1Passed = true;
    for (const check of test1Checks) {
      const symbol = check.condition ? '✓' : '✗';
      console.log(`  ${symbol} ${check.name}`);
      if (!check.condition) {
        console.log(`      (got: ${JSON.stringify(check.actual)})`);
        test1Passed = false;
      }
    }
    console.log();

    // ========== TEST 2: Cascade requeue → requeued=true ==========
    console.log('🧪 TEST 2: Requeued rider (after cascade) should have requeued=true');

    // Create 3 compatible requests
    const baseTime = new Date(Date.now() + 86400000);
    const cascadeReqs = {};

    for (const [name, userId] of Object.entries({ alice: USERS.alice, bob: USERS.bob, charlie: USERS.charlie })) {
      const lat = 30.35 + (Math.random() * 0.002);
      const lng = 76.36 + (Math.random() * 0.002);

      const res = await axios.post(`${BASE_URL}/ride-requests`, {
        pickupLat: lat,
        pickupLng: lng,
        dropLat: 30.69,
        dropLng: 76.86,
        preferredTime: baseTime.toISOString(),
      }, {
        headers: { 'X-User-ID': userId }
      });

      cascadeReqs[name] = res.data.data.id;
    }

    // Trigger matching
    const matchRes = await axios.post(`${BASE_URL}/admin/run-matching`, {});
    const matchResult = matchRes.data.data;
    console.log(`  Matching triggered: ${matchResult.users_matched} users matched`);

    // Verify Bob is MATCHED before cancel
    const bobBeforeRes = await axios.get(`${BASE_URL}/ride-requests`, {
      headers: { 'X-User-ID': USERS.bob },
      params: { status: 'MATCHED' }
    });
    const bobMatched = bobBeforeRes.data.data.find(r => r.id === cascadeReqs.bob);
    if (!bobMatched) {
      throw new Error('Bob should be MATCHED before cascade');
    }
    console.log(`  ✓ Bob verified MATCHED before cancel`);

    // Alice cancels (triggers cascade)
    await axios.post(`${BASE_URL}/ride-requests/${cascadeReqs.alice}/cancel`, {}, {
      headers: { 'X-User-ID': USERS.alice }
    });
    console.log(`  ✓ Alice cancelled (cascade triggered)`);

    // Fetch Bob's requests - should be requeued now
    const bobAfterRes = await axios.get(`${BASE_URL}/ride-requests`, {
      headers: { 'X-User-ID': USERS.bob }
    });

    const bobRequeued = bobAfterRes.data.data.find(r => r.id === cascadeReqs.bob);
    const test2Checks = [
      {
        name: 'Bob reverted to PENDING',
        condition: bobRequeued?.status === 'PENDING',
        actual: bobRequeued?.status
      },
      {
        name: 'Bob has requeued=true',
        condition: bobRequeued?.requeued === true,
        actual: bobRequeued?.requeued
      },
      {
        name: 'Bob has requeueReason=CO_RIDER_CANCELLED',
        condition: bobRequeued?.requeueReason === 'CO_RIDER_CANCELLED',
        actual: bobRequeued?.requeueReason
      }
    ];

    let test2Passed = true;
    for (const check of test2Checks) {
      const symbol = check.condition ? '✓' : '✗';
      console.log(`  ${symbol} ${check.name}`);
      if (!check.condition) {
        console.log(`      (got: ${JSON.stringify(check.actual)})`);
        test2Passed = false;
      }
    }
    console.log();

    // ========== TEST 3: MATCHED request has requeued=false ==========
    console.log('🧪 TEST 3: MATCHED request should not expose false requeue metadata');

    // Create 2 new requests and match them
    const matchReqs = {};
    for (const [name, userId] of Object.entries({ alice: USERS.alice, dave: USERS.dave })) {
      const lat = 30.35 + (Math.random() * 0.002);
      const lng = 76.36 + (Math.random() * 0.002);

      const res = await axios.post(`${BASE_URL}/ride-requests`, {
        pickupLat: lat,
        pickupLng: lng,
        dropLat: 30.69,
        dropLng: 76.86,
        preferredTime: new Date(Date.now() + 86400000).toISOString(),
      }, {
        headers: { 'X-User-ID': userId }
      });

      matchReqs[name] = res.data.data.id;
    }

    // Match
    await axios.post(`${BASE_URL}/admin/run-matching`, {});
    console.log(`  ✓ New pair matched`);

    // Fetch MATCHED requests
    const matchedRes = await axios.get(`${BASE_URL}/ride-requests`, {
      headers: { 'X-User-ID': USERS.alice }
    });

    const matchedReq = matchedRes.data.data.find(r => r.id === matchReqs.alice && r.status === 'MATCHED');
    const test3Checks = [
      {
        name: 'MATCHED request has requeued=false',
        condition: matchedReq?.requeued === false,
        actual: matchedReq?.requeued
      },
      {
        name: 'MATCHED request has requeueReason=null',
        condition: matchedReq?.requeueReason === null,
        actual: matchedReq?.requeueReason
      }
    ];

    let test3Passed = true;
    for (const check of test3Checks) {
      const symbol = check.condition ? '✓' : '✗';
      console.log(`  ${symbol} ${check.name}`);
      if (!check.condition) {
        console.log(`      (got: ${JSON.stringify(check.actual)})`);
        test3Passed = false;
      }
    }
    console.log();

    // ========== TEST 4: Self-cancelled PENDING → requeued=false ==========
    console.log('🧪 TEST 4: Cancelled-by-self PENDING should not appear requeued');

    const selfCancelRes = await axios.post(`${BASE_URL}/ride-requests`, {
      pickupLat: 30.35,
      pickupLng: 76.36,
      dropLat: 30.69,
      dropLng: 76.86,
      preferredTime: new Date(Date.now() + 86400000).toISOString(),
    }, {
      headers: { 'X-User-ID': USERS.charlie }
    });

    const selfCancelId = selfCancelRes.data.data.id;

    // Cancel while PENDING
    await axios.post(`${BASE_URL}/ride-requests/${selfCancelId}/cancel`, {}, {
      headers: { 'X-User-ID': USERS.charlie }
    });
    console.log(`  ✓ Request cancelled while PENDING`);

    // Fetch all requests
    const allRes = await axios.get(`${BASE_URL}/ride-requests`, {
      headers: { 'X-User-ID': USERS.charlie }
    });

    const cancelled = allRes.data.data.find(r => r.id === selfCancelId);
    const test4Checks = [
      {
        name: 'Self-cancelled request has status=CANCELLED',
        condition: cancelled?.status === 'CANCELLED',
        actual: cancelled?.status
      },
      {
        name: 'Self-cancelled request has requeued=false',
        condition: cancelled?.requeued === false,
        actual: cancelled?.requeued
      },
      {
        name: 'Self-cancelled request has requeueReason=null',
        condition: cancelled?.requeueReason === null,
        actual: cancelled?.requeueReason
      }
    ];

    let test4Passed = true;
    for (const check of test4Checks) {
      const symbol = check.condition ? '✓' : '✗';
      console.log(`  ${symbol} ${check.name}`);
      if (!check.condition) {
        console.log(`      (got: ${JSON.stringify(check.actual)})`);
        test4Passed = false;
      }
    }
    console.log();

    // ========== TEST 5: No N+1 queries ==========
    console.log('🧪 TEST 5: No N+1 regression - verify query batch behavior');

    // Create 5 PENDING requests for Dave
    for (let i = 0; i < 5; i++) {
      await axios.post(`${BASE_URL}/ride-requests`, {
        pickupLat: 30.35 + (i * 0.001),
        pickupLng: 76.36,
        dropLat: 30.69,
        dropLng: 76.86,
        preferredTime: new Date(Date.now() + 86400000).toISOString(),
      }, {
        headers: { 'X-User-ID': USERS.dave }
      });
    }
    console.log(`  ✓ Created 5 PENDING requests`);

    // Instrument queries
    let rideRequestFindCount = 0;
    let tripUserFindCount = 0;

    const origRideRequestFindMany = prisma.rideRequest.findMany.bind(prisma.rideRequest);
    const origTripUserFindMany = prisma.tripUser.findMany.bind(prisma.tripUser);

    prisma.rideRequest.findMany = async function(...args) {
      rideRequestFindCount++;
      return origRideRequestFindMany(...args);
    };

    prisma.tripUser.findMany = async function(...args) {
      tripUserFindCount++;
      return origTripUserFindMany(...args);
    };

    // Fetch requests
    const n1Res = await axios.get(`${BASE_URL}/ride-requests`, {
      headers: { 'X-User-ID': USERS.dave },
      params: { status: 'PENDING' }
    });

    // Restore
    prisma.rideRequest.findMany = origRideRequestFindMany;
    prisma.tripUser.findMany = origTripUserFindMany;

    const test5Checks = [
      {
        name: `Exactly 1 rideRequest.findMany call`,
        condition: rideRequestFindCount === 1,
        actual: rideRequestFindCount
      },
      {
        name: `Exactly 1 tripUser.findMany call (batch, not N+1)`,
        condition: tripUserFindCount === 1,
        actual: tripUserFindCount
      },
      {
        name: `Total 2 queries (no N+1)`,
        condition: (rideRequestFindCount + tripUserFindCount) === 2,
        actual: rideRequestFindCount + tripUserFindCount
      },
      {
        name: `All 5+ requests returned with requeued field`,
        condition: n1Res.data.data.length >= 5 && n1Res.data.data.every(r => r.hasOwnProperty('requeued')),
        actual: `${n1Res.data.data.length} requests, all have requeued: ${n1Res.data.data.every(r => r.hasOwnProperty('requeued'))}`
      }
    ];

    let test5Passed = true;
    for (const check of test5Checks) {
      const symbol = check.condition ? '✓' : '✗';
      console.log(`  ${symbol} ${check.name}`);
      if (!check.condition) {
        console.log(`      (got: ${JSON.stringify(check.actual)})`);
        test5Passed = false;
      }
    }
    console.log();

    // ========== FINAL RESULTS ==========
    console.log('🎯 TEST SUMMARY:\n');

    const allPassed = test1Passed && test2Passed && test3Passed && test4Passed && test5Passed;

    const results = [
      { test: 'TEST 1: Fresh PENDING', passed: test1Passed },
      { test: 'TEST 2: Requeued after cascade', passed: test2Passed },
      { test: 'TEST 3: MATCHED response shape', passed: test3Passed },
      { test: 'TEST 4: Self-cancelled', passed: test4Passed },
      { test: 'TEST 5: No N+1 queries', passed: test5Passed }
    ];

    for (const result of results) {
      const symbol = result.passed ? '✅' : '❌';
      console.log(`  ${symbol} ${result.test}`);
    }

    console.log();
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED - Requeue semantics working correctly');
      return true;
    } else {
      console.log('❌ SOME TESTS FAILED - See details above');
      return false;
    }
  } catch (err) {
    console.error('❌ TEST CRASHED:', err.message);
    console.error(err.stack);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = runRequeueSemanticsTest;

// Run if executed directly
if (require.main === module) {
  runRequeueSemanticsTest()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
