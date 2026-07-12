const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

/**
 * Test: Idempotent Cancellation
 * 
 * Validates that calling cancel twice on the same request
 * is safe and returns consistent results (idempotent)
 */

async function runIdempotentCancelTest() {
  console.log('\n🧪 TEST: Idempotent Cancellation\n');

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
      throw new Error('Matching failed');
    }

    // STEP 3: First cancellation
    console.log('💥 STEP 3: Alice cancels (first call)...');
    const cancelRes1 = await axios.post(
      `${BASE_URL}/ride-requests/${requestIds.alice}/cancel`,
      {},
      { headers: { 'X-User-ID': USERS.alice } }
    );
    const result1 = cancelRes1.data.data;
    console.log(`  Response: ${JSON.stringify(result1)}\n`);

    // STEP 4: Second cancellation (idempotent)
    console.log('🔄 STEP 4: Alice cancels again (idempotent call)...');
    const cancelRes2 = await axios.post(
      `${BASE_URL}/ride-requests/${requestIds.alice}/cancel`,
      {},
      { headers: { 'X-User-ID': USERS.alice } }
    );
    const result2 = cancelRes2.data.data;
    console.log(`  Response: ${JSON.stringify(result2)}\n`);

    // STEP 5: Verify both calls succeeded
    console.log('📊 STEP 5: Validating idempotency...');

    const checks = [
      {
        name: 'First call: status is CANCELLED',
        condition: result1.status === 'CANCELLED',
        actual: result1.status
      },
      {
        name: 'Second call: status is CANCELLED',
        condition: result2.status === 'CANCELLED',
        actual: result2.status
      },
      {
        name: 'First call has cancelledTripId',
        condition: !!result1.cancelledTripId,
        actual: result1.cancelledTripId ? 'present' : 'missing'
      },
      {
        name: 'Second call has cancelledTripId',
        condition: !!result2.cancelledTripId,
        actual: result2.cancelledTripId ? 'present' : 'missing'
      },
      {
        name: 'TripIds match (same trip)',
        condition: result1.cancelledTripId === result2.cancelledTripId,
        actual: `${result1.cancelledTripId} === ${result2.cancelledTripId}`
      },
      {
        name: 'Second call returns safely (no 500 error)',
        condition: cancelRes2.status === 200,
        actual: cancelRes2.status
      },
    ];

    let passed = true;
    console.log('\n🎯 TEST VALIDATION:\n');
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
      console.log('🎉 TEST PASSED - Idempotent cancellation working correctly');
      console.log('   Double-cancel is safe and returns consistent results');
      return true;
    } else {
      console.log('❌ TEST FAILED - Idempotency not working');
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
  runIdempotentCancelTest()
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

module.exports = runIdempotentCancelTest;
