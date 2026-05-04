/**
 * Test: Matching After Cancel
 * 
 * Validates that reverted users can re-match cleanly:
 * 1. Match 3 users (A, B, C) into Trip 1
 * 2. A cancels → Trip 1 CANCELLED, B & C → PENDING
 * 3. Run matching again
 * 4. B & C should match into a new Trip 2
 * 
 * Tests for:
 * - No constraint errors
 * - No reference to dead Trip 1
 * - Clean state transitions
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

async function testMatchingAfterCancel() {
  console.log('\n🧪 TEST: Matching After Cancel (Reuse Scenario)\n');

  try {
    // STEP 0: Get users
    console.log('📋 STEP 0: Fetching users...');
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com']
        }
      }
    });

    const USERS = {
      alice: users.find(u => u.email === 'alice@test.com')?.id,
      bob: users.find(u => u.email === 'bob@test.com')?.id,
      charlie: users.find(u => u.email === 'charlie@test.com')?.id,
      diana: users.find(u => u.email === 'diana@test.com')?.id,
    };

    if (!USERS.alice || !USERS.bob || !USERS.charlie || !USERS.diana) {
      throw new Error('Could not find test users');
    }
    console.log('  ✅ Found 4 users');
    
    // Clean up
    console.log('📋 STEP 0b: Cleaning up pending/matched requests...');
    await prisma.rideRequest.deleteMany({
      where: { status: { in: ['PENDING', 'MATCHED'] } }
    });
    console.log('  ✅ Cleaned\n');

    // STEP 1: Create 3 compatible requests
    console.log('📝 STEP 1: Creating 3 compatible requests (A, B, C)...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const baseTime = new Date(tomorrow);
    baseTime.setHours(18, 30, 0, 0);
    
    const requests = [
      { userId: USERS.alice, lat1: 30.3525, lng1: 76.3616, lat2: 30.6942, lng2: 76.8606 },
      { userId: USERS.bob, lat1: 30.3530, lng1: 76.3620, lat2: 30.6940, lng2: 76.8600 },
      { userId: USERS.charlie, lat1: 30.3527, lng1: 76.3618, lat2: 30.6945, lng2: 76.8610 },
    ];

    const requestIds = {};
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      const response = await axios.post(`${BASE_URL}/ride-requests`, {
        pickupLat: req.lat1,
        pickupLng: req.lng1,
        dropLat: req.lat2,
        dropLng: req.lng2,
        preferredTime: new Date(baseTime.getTime() + i * 60000).toISOString(),
      }, {
        headers: { 'X-User-ID': req.userId }
      });
      const name = ['alice', 'bob', 'charlie'][i];
      requestIds[name] = response.data.data.id;
      console.log(`  ✅ ${name}: ${response.data.data.id.substring(0, 8)}`);
    }
    console.log();

    // STEP 2: Trigger matching (should create Trip 1 with A, B, C)
    console.log('⚙️  STEP 2: Matching cycle 1 (creates Trip 1)...');
    await axios.post(`${BASE_URL}/admin/run-matching`, {});
    
    const trip1 = await prisma.trip.findFirst({
      where: { status: 'ACTIVE' },
      include: { tripUsers: true }
    });
    
    if (!trip1) {
      throw new Error('Trip 1 not found after matching');
    }
    
    console.log(`  ✅ Trip 1 created: ${trip1.id.substring(0, 8)}`);
    console.log(`     Users: ${trip1.tripUsers.length}\n`);

    // STEP 3: Alice cancels (triggers cascade)
    console.log('💥 STEP 3: Alice cancels her request...');
    await axios.post(
      `${BASE_URL}/ride-requests/${requestIds.alice}/cancel`,
      {},
      { headers: { 'X-User-ID': USERS.alice } }
    );
    
    // Verify trip 1 cancelled
    const trip1After = await prisma.trip.findUnique({
      where: { id: trip1.id }
    });
    console.log(`  ✅ Trip 1 status: ${trip1After.status}\n`);

    if (trip1After.status !== 'CANCELLED') {
      throw new Error('Trip 1 should be CANCELLED after cascade');
    }

    // Verify B and C are PENDING
    const bAfterCancel = await prisma.rideRequest.findUnique({
      where: { id: requestIds.bob }
    });
    const cAfterCancel = await prisma.rideRequest.findUnique({
      where: { id: requestIds.charlie }
    });
    
    console.log(`  Bob status: ${bAfterCancel.status} (expect PENDING)`);
    console.log(`  Charlie status: ${cAfterCancel.status} (expect PENDING)\n`);

    // STEP 4: Create one more compatible request (Diana)
    console.log('📝 STEP 4: Creating 4th compatible request (Diana)...');
    const dianaResponse = await axios.post(`${BASE_URL}/ride-requests`, {
      pickupLat: 30.3529,
      pickupLng: 76.3619,
      dropLat: 30.6941,
      dropLng: 76.8609,
      preferredTime: new Date(baseTime.getTime() + 3 * 60000).toISOString(),
    }, {
      headers: { 'X-User-ID': USERS.diana }
    });
    requestIds.diana = dianaResponse.data.data.id;
    console.log(`  ✅ Diana: ${requestIds.diana.substring(0, 8)}\n`);

    // STEP 5: Trigger matching again (should create Trip 2 with B, C, Diana)
    console.log('⚙️  STEP 5: Matching cycle 2 (creates Trip 2 with B, C, Diana)...');
    
    // Check pending requests before matching
    const pendingBefore = await prisma.rideRequest.findMany({
      where: { status: 'PENDING' }
    });
    console.log(`  Pending requests before matching: ${pendingBefore.length}`);
    for (const r of pendingBefore) {
      const name = Object.entries(requestIds).find(([_, id]) => id === r.id)?.[0] || '?';
      console.log(`    - ${name}: ${r.id.substring(0, 8)}`);
    }
    
    try {
      const matchRes = await axios.post(`${BASE_URL}/admin/run-matching`, {});
      console.log(`  ✅ Matching succeeded`);
      console.log(`     Trips created: ${matchRes.data.data.trips_created}`);
      console.log(`     Users matched: ${matchRes.data.data.users_matched}\n`);
    } catch (matchErr) {
      console.error('  ❌ Matching failed with error:');
      console.error(`     ${matchErr.response?.data?.error?.message || matchErr.message}`);
      throw matchErr;
    }

    // Verify Trip 2 exists with correct users
    const trip2 = await prisma.trip.findFirst({
      where: { status: 'ACTIVE' },
      include: { tripUsers: true }
    });

    if (!trip2) {
      throw new Error('Trip 2 not created - matching after cancel failed');
    }

    console.log(`  Trip 2 created: ${trip2.id.substring(0, 8)}`);
    console.log(`  Trip 2 users: ${trip2.tripUsers.length}`);
    
    // Verify B, C, Diana are in Trip 2
    const trip2RideIds = trip2.tripUsers.map(tu => tu.rideRequestId);
    const hasB = trip2RideIds.includes(requestIds.bob);
    const hasC = trip2RideIds.includes(requestIds.charlie);
    const hasD = trip2RideIds.includes(requestIds.diana);
    
    console.log(`  ✅ Bob in Trip 2: ${hasB}`);
    console.log(`  ✅ Charlie in Trip 2: ${hasC}`);
    console.log(`  ✅ Diana in Trip 2: ${hasD}\n`);

    // STEP 6: Verify Trip 1 and Trip 2 are separate
    console.log('📊 STEP 6: Verifying state integrity...');
    console.log(`  Trip 1 ID: ${trip1.id.substring(0, 8)} (status: ${trip1After.status})`);
    console.log(`  Trip 2 ID: ${trip2.id.substring(0, 8)} (status: ${trip2.status})`);
    console.log(`  Different trips: ${trip1.id !== trip2.id} ✓\n`);

    // STEP 7: Validate
    console.log('🎯 TEST VALIDATION:\n');
    
    let passed = true;
    const checks = [
      {
        name: 'Trip 1 is CANCELLED',
        condition: trip1After.status === 'CANCELLED'
      },
      {
        name: 'Trip 2 is ACTIVE',
        condition: trip2.status === 'ACTIVE'
      },
      {
        name: 'Trip 2 has 3 users',
        condition: trip2.tripUsers.length === 3
      },
      {
        name: 'Bob in Trip 2',
        condition: hasB
      },
      {
        name: 'Charlie in Trip 2',
        condition: hasC
      },
      {
        name: 'Diana in Trip 2',
        condition: hasD
      },
    ];

    for (const check of checks) {
      const symbol = check.condition ? '✓' : '✗';
      console.log(`  ${symbol} ${check.name}`);
      if (!check.condition) {
        passed = false;
      }
    }

    console.log();
    if (passed) {
      console.log('🎉 TEST PASSED - System handles reuse cleanly');
      return true;
    } else {
      console.log('❌ TEST FAILED - Reuse scenario broken');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  ${error.response.data?.error?.message}`);
    } else {
      console.error(`  ${error.message}`);
    }
    await prisma.$disconnect();
    return false;
  }
}

if (require.main === module) {
  testMatchingAfterCancel()
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

module.exports = testMatchingAfterCancel;
