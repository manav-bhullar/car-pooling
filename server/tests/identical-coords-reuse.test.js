const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

/**
 * Test: Identical Coordinates Reuse
 *
 * Validates that when all ride requests have identical coordinates:
 * - A match is always created.
 * - Lifecycle is clean.
 */

async function runIdenticalCoordsReuseTest() {
  console.log('\n🧪 TEST: Identical Coordinates Reuse\n');

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
    console.log('  ✅ Found 3 users');

    // STEP 0b: Clean up stale requests from previous test runs
    console.log('📋 STEP 0b: Cleaning up all pending requests...');

    const allStaleRequests = await prisma.rideRequest.findMany({
      where: {
        status: { in: ['PENDING', 'MATCHED'] }
      }
    });

    if (allStaleRequests.length > 0) {
      await prisma.rideRequest.deleteMany({
        where: {
          status: { in: ['PENDING', 'MATCHED'] }
        }
      });
      console.log(`  ✅ Deleted ${allStaleRequests.length} stale requests\n`);
    } else {
      console.log('  ✅ No stale requests found\n');
    }

    // STEP 1: Create 3 identical ride requests
    console.log('📝 STEP 1: Creating 3 identical ride requests...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const baseTime = new Date(tomorrow);
    baseTime.setHours(18, 30, 0, 0);

    const identicalCoords = {
      pickupLat: 30.3525,
      pickupLng: 76.3616,
      dropLat: 30.6942,
      dropLng: 76.8606,
    };

    const requests = [
      {
        userId: USERS.alice,
        ...identicalCoords,
        preferredTime: baseTime.toISOString(),
      },
      {
        userId: USERS.bob,
        ...identicalCoords,
        preferredTime: new Date(baseTime.getTime() + 2 * 60000).toISOString(),
      },
      {
        userId: USERS.charlie,
        ...identicalCoords,
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

    console.log('🎉 TEST PASSED - Identical coordinates matching works correctly');
    return true;

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
  runIdenticalCoordsReuseTest()
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

module.exports = runIdenticalCoordsReuseTest;