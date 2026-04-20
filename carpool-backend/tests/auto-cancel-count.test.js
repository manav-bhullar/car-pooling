/**
 * Extended Test: Verify autoCancelledCount is precise per-cycle
 * Tests that the delta-based counting correctly tracks cancellations
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

async function testAutoCancelledCountAccuracy() {
  console.log('\n🧪 TEST: autoCancelledCount Precision (Delta-based)\n');
  
  try {
    // Reset
    console.log('📋 STEP 0: Resetting database...');
    const { execSync } = require('child_process');
    execSync('npm run db:reset 2>&1 | tail -3', {
      stdio: 'inherit',
      cwd: __dirname + '/../../'
    });

    // Get first user
    const user = await prisma.user.findFirst();
    const userId = user.id;

    // Create single request
    console.log('\n📝 STEP 1: Creating single ride request...');
    const createResponse = await axios.post(`${BASE_URL}/ride-requests`, {
      pickupLat: 30.3525,
      pickupLng: 76.3616,
      dropLat: 30.6942,
      dropLng: 76.8606,
      preferredTime: '2026-04-20T18:30:00Z',
    }, {
      headers: { 'x-user-id': userId }
    });

    const rideRequestId = createResponse.data.data.id;
    console.log(`  ✅ Created request: ${rideRequestId.substring(0, 8)}\n`);

    // Run 6 cycles and check logs each time
    console.log('⚙️  STEP 2: Running matching cycles and checking logs...\n');

    for (let cycle = 1; cycle <= 6; cycle++) {
      // Run matching
      await axios.post(`${BASE_URL}/admin/run-matching`);

      // Get the latest log
      const latestLog = await prisma.matchCycleLog.findFirst({
        orderBy: { runAt: 'desc' }
      });

      console.log(`  Cycle ${cycle}:`);
      console.log(`    • pendingCountStart: ${latestLog.pendingCountStart}`);
      console.log(`    • tripsCreated: ${latestLog.tripsCreated}`);
      console.log(`    • usersMatched: ${latestLog.usersMatched}`);
      console.log(`    • usersStillPending: ${latestLog.usersStillPending}`);
      console.log(`    • autoCancelledCount: ${latestLog.autoCancelledCount}`);

      // Check request state
      const request = await prisma.rideRequest.findUnique({
        where: { id: rideRequestId }
      });
      console.log(`    • request status: ${request.status}, pendingCycles: ${request.pendingCycles}\n`);
    }

    // Analysis
    console.log('📊 STEP 3: Analyzing results...\n');
    
    const allLogs = await prisma.matchCycleLog.findMany({
      orderBy: { runAt: 'asc' },
      take: 6
    });

    let testPassed = true;
    const expectedAutoCancelled = [0, 0, 0, 0, 1, 0]; // Should be 1 in cycle 5

    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i];
      const expected = expectedAutoCancelled[i] || 0;
      const match = log.autoCancelledCount === expected;

      console.log(`  Cycle ${i + 1}:`);
      console.log(`    ✓ autoCancelledCount: ${log.autoCancelledCount} (expected ${expected}) ${match ? '✓' : '❌'}`);

      if (!match) testPassed = false;
    }

    // Final result
    console.log('\n🎯 TEST RESULT:');
    if (testPassed) {
      console.log('  ✅ SUCCESS - autoCancelledCount is precise per-cycle');
      console.log('     • Cycles 1-4: autoCancelledCount = 0 (no cancellations yet)');
      console.log('     • Cycle 5: autoCancelledCount = 1 (request auto-cancelled)');
      console.log('     • Delta-based counting is working correctly\n');
      return true;
    } else {
      console.log('  ❌ FAILED - autoCancelledCount has precision issues\n');
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
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testAutoCancelledCountAccuracy()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
