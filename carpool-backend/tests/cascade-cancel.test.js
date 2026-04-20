const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

/**
 * Test: Cascade Cancellation
 * 
 * Validates that when a MATCHED user cancels:
 * - Trip → CANCELLED
 * - Cancelling user → CANCELLED
 * - Co-riders → PENDING (rejoin queue)
 */

async function runCascadeCancelTest() {
  console.log('\n🧪 TEST: Cascade Cancellation\n');

  try {
    // STEP 0: Get users
    console.log('📋 STEP 0: Fetching users...');
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['alice@test.com', 'bob@test.com', 'charlie@test.com']
        }
      }
    });

    const USERS = {
      alice: users.find(u => u.email === 'alice@test.com')?.id,
      bob: users.find(u => u.email === 'bob@test.com')?.id,
      charlie: users.find(u => u.email === 'charlie@test.com')?.id,
    };

    if (!USERS.alice || !USERS.bob || !USERS.charlie) {
      throw new Error('Could not find test users');
    }
    console.log('  ✅ Found 3 users\n');

    // STEP 1: Create 3 compatible ride requests
    console.log('📝 STEP 1: Creating 3 compatible ride requests...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const baseTime = new Date(tomorrow);
    baseTime.setHours(18, 30, 0, 0);
    
    const requests = [
      {
        userId: USERS.alice,
        pickupLat: 30.3525,
        pickupLng: 76.3616,
        dropLat: 30.6942,
        dropLng: 76.8606,
        preferredTime: baseTime.toISOString(),
      },
      {
        userId: USERS.bob,
        pickupLat: 30.3530,
        pickupLng: 76.3620,
        dropLat: 30.6940,
        dropLng: 76.8600,
        preferredTime: new Date(baseTime.getTime() + 2 * 60000).toISOString(),
      },
      {
        userId: USERS.charlie,
        pickupLat: 30.3527,
        pickupLng: 76.3618,
        dropLat: 30.6945,
        dropLng: 76.8610,
        preferredTime: new Date(baseTime.getTime() + 1 * 60000).toISOString(),
      },
    ];

    const requestIds = {};
    for (const req of requests) {
      const response = await axios.post(`${BASE_URL}/ride-requests`, req, {
        headers: { 'X-User-ID': req.userId }
      });
      const name = ['alice', 'bob', 'charlie'][Object.keys(requestIds).length];
      requestIds[name] = response.data.data.id;
      console.log(`  ✅ ${name}: ${response.data.data.id}`);
    }
    console.log();

    // STEP 2: Trigger matching
    console.log('⚙️  STEP 2: Triggering matching cycle...');
    const triggerRes = await axios.post(`${BASE_URL}/admin/run-matching`, {});
    const matchResult = triggerRes.data.data;
    console.log(`  Trips created: ${matchResult.trips_created}`);
    console.log(`  Users matched: ${matchResult.users_matched}\n`);

    if (matchResult.trips_created !== 1 || matchResult.users_matched !== 3) {
      throw new Error('Matching failed - expected 1 trip with 3 users');
    }

    // STEP 3: Get trip ID
    console.log('🔍 STEP 3: Retrieving trip details...');
    const trip = await prisma.trip.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tripUsers: true
      }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    const tripId = trip.id;
    console.log(`  Trip ID: ${tripId}`);
    console.log(`  Trip users: ${trip.tripUsers.length}`);
    
    // Get the ride requests for these trip users
    const tripUserRequestIds = trip.tripUsers.map(tu => tu.rideRequestId);
    const tripRequests = await prisma.rideRequest.findMany({
      where: { id: { in: tripUserRequestIds } }
    });
    
    for (const req of tripRequests) {
      const userName = Object.entries(USERS).find(([_, id]) => id === req.userId)?.[0] || 'unknown';
      console.log(`    - ${userName}: ${req.id} (${req.status})`);
    }
    console.log();

    // STEP 4: Cancel Alice's request (she's MATCHED)
    console.log('💥 STEP 4: Alice cancels her matched request...');
    const cancelRes = await axios.post(
      `${BASE_URL}/ride-requests/${requestIds.alice}/cancel`,
      {},
      { headers: { 'X-User-ID': USERS.alice } }
    );
    console.log(`  Cancel response: ${JSON.stringify(cancelRes.data.data)}\n`);

    // STEP 5: Verify cascade effects
    console.log('📊 STEP 5: Verifying cascade effects...');

    // Check trip status
    const tripAfter = await prisma.trip.findUnique({
      where: { id: tripId }
    });
    console.log(`  Trip status: ${tripAfter.status} (expected: CANCELLED)`);

    // Check all request statuses
    const requestsAfter = await prisma.rideRequest.findMany({
      where: {
        id: { in: Object.values(requestIds) }
      }
    });

    const stateMap = {};
    for (const req of requestsAfter) {
      const name = Object.entries(requestIds).find(([_, id]) => id === req.id)?.[0];
      stateMap[name] = req.status;
      console.log(`  ${name}: ${req.status}`);
    }
    console.log();

    // STEP 6: Validate results
    console.log('🎯 TEST VALIDATION:\n');

    let passed = true;
    const checks = [
      {
        name: 'Trip is CANCELLED',
        condition: tripAfter.status === 'CANCELLED',
        actual: tripAfter.status
      },
      {
        name: 'Alice is CANCELLED',
        condition: stateMap.alice === 'CANCELLED',
        actual: stateMap.alice
      },
      {
        name: 'Bob is PENDING (reverted)',
        condition: stateMap.bob === 'PENDING',
        actual: stateMap.bob
      },
      {
        name: 'Charlie is PENDING (reverted)',
        condition: stateMap.charlie === 'PENDING',
        actual: stateMap.charlie
      },
    ];

    for (const check of checks) {
      const symbol = check.condition ? '✓' : '✗';
      const status = check.condition ? '✅' : '❌';
      console.log(`  ${symbol} ${check.name}`);
      if (!check.condition) {
        console.log(`      (got: ${check.actual})`);
        passed = false;
      }
    }

    console.log();
    if (passed) {
      console.log('🎉 TEST PASSED - Cascade cancellation working correctly');
      return true;
    } else {
      console.log('❌ TEST FAILED - Cascade not working as expected');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`  ${error.message}`);
    }
    await prisma.$disconnect();
    return false;
  }
}

// Run test
if (require.main === module) {
  runCascadeCancelTest()
    .then(async passed => {
      await prisma.$disconnect();
      process.exit(passed ? 0 : 1);
    })
    .catch(async err => {
      await prisma.$disconnect();
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

module.exports = runCascadeCancelTest;
