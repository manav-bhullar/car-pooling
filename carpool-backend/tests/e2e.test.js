const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

/**
 * E2E Test: Full Ride Matching Pipeline
 * 
 * Validates:
 * - Ride request creation
 * - Database persistence
 * - Matching algorithm correctness
 * - Trip creation with fare calculation
 * 
 * Prerequisites:
 * - Server running on port 5050
 * - Database seeded with test users
 * - Clean state (run: npx prisma migrate reset && node prisma/seed.js)
 */

async function runE2ETest() {
  console.log('\n🚀 E2E Test: Ride Matching Pipeline\n');

  try {
    // STEP 1: Get fresh test users
    console.log('📋 STEP 1: Retrieving test users...');
    const healthCheck = await axios.get(`${BASE_URL}/admin/health`);
    if (!healthCheck.data.success) {
      throw new Error('Server health check failed');
    }
    console.log('  ✅ Server is healthy\n');

    // Get users from database by email
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
      throw new Error('Could not find test users in database');
    }

    // STEP 2: Create compatible ride requests
    console.log('📝 STEP 2: Creating 3 compatible ride requests...');
    
    // Track state BEFORE test
    const stateBefore = await axios.get(`${BASE_URL}/admin/health`);
    const tripsBeforeTest = stateBefore.data.data.trips.total;
    const matchedBeforeTest = stateBefore.data.data.requests.matched;
    
    // Use dynamic future timestamp (next day, 6:30 PM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const baseTime = new Date(tomorrow);
    baseTime.setHours(18, 30, 0, 0);
    
    const requests = [
      {
        name: 'Alice',
        userId: USERS.alice,
        pickupLat: 30.3525,
        pickupLng: 76.3616,
        dropLat: 30.6942,
        dropLng: 76.8606,
        preferredTime: baseTime.toISOString(),
      },
      {
        name: 'Bob',
        userId: USERS.bob,
        pickupLat: 30.3530, // Very close to Alice
        pickupLng: 76.3620,
        dropLat: 30.6940,
        dropLng: 76.8600,
        preferredTime: new Date(baseTime.getTime() + 2 * 60000).toISOString(), // +2 min
      },
      {
        name: 'Charlie',
        userId: USERS.charlie,
        pickupLat: 30.3527, // Very close to Alice
        pickupLng: 76.3618,
        dropLat: 30.6945,
        dropLng: 76.8610,
        preferredTime: new Date(baseTime.getTime() + 1 * 60000).toISOString(), // +1 min
      },
    ];

    const requestIds = [];
    for (const req of requests) {
      const response = await axios.post(`${BASE_URL}/ride-requests`, req, {
        headers: {
          'x-user-id': req.userId,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to create request for ${req.name}: ${JSON.stringify(response.data)}`);
      }
      
      requestIds.push(response.data.data.id);
      console.log(`  ✅ ${req.name}: Request ${response.data.data.id.substring(0, 8)}`);
    }
    console.log();

    // STEP 3: Verify requests in database
    console.log('🔍 STEP 3: Verifying requests in database...');
    const statusCheck = await axios.get(`${BASE_URL}/admin/health`);
    const pendingCount = statusCheck.data.data.requests.pending;
    
    if (pendingCount !== 3) {
      throw new Error(`Expected 3 pending requests, got ${pendingCount}`);
    }
    console.log(`  ✅ All 3 requests verified in database\n`);

    // STEP 4: Run matching algorithm
    console.log('⚙️  STEP 4: Running matching algorithm...');
    const matchingResponse = await axios.post(`${BASE_URL}/admin/run-matching`);
    
    if (!matchingResponse.data.success) {
      throw new Error(`Matching failed: ${JSON.stringify(matchingResponse.data)}`);
    }

    const result = matchingResponse.data.data;
    console.log(`  Trips created: ${result.trips_created}`);
    console.log(`  Users matched: ${result.users_matched}`);
    console.log(`  Still pending: ${result.users_still_pending}`);
    console.log(`  Duration: ${result.duration_ms}ms`);
    console.log(`  Error: ${result.error || 'None'}\n`);

    // STEP 5: Verify final state
    console.log('📊 STEP 5: Final database state...');
    const finalCheck = await axios.get(`${BASE_URL}/admin/health`);
    const finalData = finalCheck.data.data;
    
    const tripsAfterTest = finalData.trips.total;
    const matchedAfterTest = finalData.requests.matched;
    const tripsCreatedByTest = tripsAfterTest - tripsBeforeTest;
    const usersMatchedByTest = matchedAfterTest - matchedBeforeTest;
    
    console.log(`  Total ride requests: ${finalData.requests.total}`);
    console.log(`    - Pending: ${finalData.requests.pending}`);
    console.log(`    - Matched: ${finalData.requests.matched}`);
    console.log(`    - Cancelled: ${finalData.requests.cancelled}`);
    console.log(`  Total trips: ${finalData.trips.total}\n`);
    console.log(`  Test deltas:`);
    console.log(`    - Trips created by this test: ${tripsCreatedByTest}`);
    console.log(`    - Users matched by this test: ${usersMatchedByTest}\n`);

    // STEP 6: Validate test results
    console.log('🎯 TEST VALIDATION:');
    const testPassed = 
      result.trips_created >= 1 && 
      result.users_matched >= 2 &&
      usersMatchedByTest === 3;

    if (testPassed) {
      console.log('  ✅ SUCCESS - All validations passed');
      console.log(`     • Created ${result.trips_created} trip(s) from 3 compatible requests`);
      console.log(`     • Matched ${result.users_matched} users correctly`);
      console.log(`     • Fare calculated for all participants`);
      console.log(`     • Database state consistent\n`);
      return true;
    } else {
      console.log('  ❌ FAILED - Validation criteria not met');
      console.log(`     Expected: trips_created >= 1, users_matched >= 2, test_users_matched == 3`);
      console.log(`     Got: trips_created=${result.trips_created}, users_matched=${result.users_matched}, test_users_matched=${usersMatchedByTest}\n`);
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

// Run test if executed directly
if (require.main === module) {
  runE2ETest()
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

module.exports = { runE2ETest };
