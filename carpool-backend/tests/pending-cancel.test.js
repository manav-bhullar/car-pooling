const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

/**
 * Test: Cancel PENDING Request
 * 
 * Validates that cancelling a PENDING request returns consistent response shape
 */

async function runPendingCancelTest() {
  console.log('\n🧪 TEST: Cancel PENDING Request\n');

  try {
    // Get a user
    console.log('📋 STEP 0: Fetching user...');
    const user = await prisma.user.findFirst({
      where: { email: 'alice@test.com' }
    });

    if (!user) {
      throw new Error('Could not find test user');
    }
    console.log('  ✅ Found user\n');

    // Create a PENDING request
    console.log('📝 STEP 1: Creating PENDING request...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const baseTime = new Date(tomorrow);
    baseTime.setHours(18, 30, 0, 0);

    const createRes = await axios.post(`${BASE_URL}/ride-requests`, {
      userId: user.id,
      pickupLat: 30.3525,
      pickupLng: 76.3616,
      dropLat: 30.6942,
      dropLng: 76.8606,
      preferredTime: baseTime.toISOString(),
    }, {
      headers: { 'X-User-ID': user.id }
    });

    const requestId = createRes.data.data.id;
    console.log(`  ✅ Created request: ${requestId}\n`);

    // Cancel the PENDING request
    console.log('💥 STEP 2: Cancel PENDING request...');
    const cancelRes = await axios.post(
      `${BASE_URL}/ride-requests/${requestId}/cancel`,
      {},
      { headers: { 'X-User-ID': user.id } }
    );

    const response = cancelRes.data.data;
    console.log(`  Response: ${JSON.stringify(response, null, 2)}\n`);

    // Validate response shape
    console.log('📊 STEP 3: Validating response shape...\n');
    const checks = [
      {
        name: 'Has id field',
        condition: !!response.id && response.id === requestId,
        actual: response.id
      },
      {
        name: 'Has status field',
        condition: response.status === 'CANCELLED',
        actual: response.status
      },
      {
        name: 'Has cancelledTripId field',
        condition: response.hasOwnProperty('cancelledTripId'),
        actual: response.cancelledTripId
      },
      {
        name: 'cancelledTripId is null (no trip for PENDING)',
        condition: response.cancelledTripId === null,
        actual: response.cancelledTripId
      },
      {
        name: 'Response shape is consistent with MATCHED cancel',
        condition: typeof response === 'object' && 'id' in response && 'status' in response && 'cancelledTripId' in response,
        actual: 'yes'
      },
    ];

    let passed = true;
    console.log('🎯 TEST VALIDATION:\n');
    for (const check of checks) {
      const symbol = check.condition ? '✓' : '✗';
      const status = check.condition ? '✅' : '❌';
      console.log(`  ${symbol} ${check.name}`);
      if (!check.condition) {
        console.log(`      (got: ${JSON.stringify(check.actual)})`);
        passed = false;
      }
    }

    console.log();
    if (passed) {
      console.log('🎉 TEST PASSED - PENDING cancel returns consistent shape');
      return true;
    } else {
      console.log('❌ TEST FAILED - Response shape not consistent');
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
  runPendingCancelTest()
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

module.exports = runPendingCancelTest;
