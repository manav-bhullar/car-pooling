/**
 * Test: Time-based auto-cancellation logic
 * 
 * Scenario:
 * - preferredTime is > 45 minutes old (stale)
 * - pendingCycles = 1 (too low to trigger cycle-based cancel at threshold >= 20)
 * - Expected: Request should be cancelled due to preferredTime alone
 * 
 * This validates that the time-based cancellation works independently
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

async function testTimeBasedCancellation() {
  console.log('\n🧪 TEST: Time-based Auto-Cancellation Logic\n');
  
  try {
    // Get any available test user (assumes DB is pre-seeded)
    console.log('📋 STEP 0: Getting test user (DB must be pre-seeded)...');
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No test users found. Run: npm run db:reset');
    }
    const userId = user.id;
    console.log(`  ✅ Using user: ${user.name}`);

    // Create a ride request with FUTURE preferredTime first (passes validator)
    console.log('\n📝 STEP 1: Creating ride request via API (with near-future time)...');
    
    const futureTime = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
    
    const createResponse = await axios.post(`${BASE_URL}/ride-requests`, {
      pickupLat: 30.3525,
      pickupLng: 76.3616,
      dropLat: 30.6942,
      dropLng: 76.8606,
      preferredTime: futureTime.toISOString(),
    }, {
      headers: { 'x-user-id': userId }
    });

    const rideRequestId = createResponse.data.data.id;
    console.log(`  ✅ Created request: ${rideRequestId.substring(0, 8)}`);
    
    // NOW manually set preferredTime to 50 minutes ago (circumvent validator)
    console.log('\n📝 STEP 1b: Setting preferredTime to 50 minutes ago (bypass validator)...');
    const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000);
    
    await prisma.rideRequest.update({
      where: { id: rideRequestId },
      data: { preferredTime: fiftyMinutesAgo }
    });
    
    let request = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId }
    });
    console.log(`  ✅ preferredTime updated to: ${request.preferredTime.toISOString()}`);
    
    // Manually set pendingCycles to 1 (simulating early cycle)
    console.log('\n📝 STEP 2: Setting pendingCycles = 1 (low, below 20 threshold)...');
    await prisma.rideRequest.update({
      where: { id: rideRequestId },
      data: { pendingCycles: 1 }
    });
    
    request = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId }
    });
    console.log(`  ✅ pendingCycles set to: ${request.pendingCycles}`);

    // Run matching cycle
    console.log('\n⚙️  STEP 3: Running matching cycle...');
    await axios.post(`${BASE_URL}/admin/run-matching`);
    
    // Check the latest log
    const latestLog = await prisma.matchCycleLog.findFirst({
      orderBy: { runAt: 'desc' }
    });
    
    console.log(`  ✅ Cycle completed`);
    console.log(`     autoCancelledCount: ${latestLog.autoCancelledCount}`);
    console.log(`     timeCancelled breakdown: (check logs for cycles vs time split)`);

    // Verify request was cancelled
    request = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId }
    });

    console.log('\n📊 STEP 4: Verifying result...\n');
    console.log(`  Final request status: ${request.status}`);
    console.log(`  Final pendingCycles: ${request.pendingCycles}`);

    if (request.status === 'CANCELLED') {
      console.log('\n✅ TEST PASSED');
      console.log('   Request was cancelled due to stale preferredTime');
      console.log('   Even though pendingCycles (1) < threshold (20)');
      console.log('   Time-based cancellation logic is working correctly.\n');
      return true;
    } else {
      console.log('\n❌ TEST FAILED');
      console.log(`   Expected status: CANCELLED`);
      console.log(`   Actual status: ${request.status}`);
      console.log('   Time-based cancellation did not trigger.\n');
      return false;
    }

  } catch (err) {
    console.error('\n❌ TEST ERROR:', err.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testTimeBasedCancellation().then(passed => {
  process.exit(passed ? 0 : 1);
});
