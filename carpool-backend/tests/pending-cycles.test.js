/**
 * Test: pending_cycles Increment and Auto-Cancellation
 * 
 * Scenario:
 * - Create 1 single ride request (won't match with itself)
 * - Run matching 5 times
 * - Verify pendingCycles increments each cycle
 * - Verify auto-cancellation happens on 5th cycle
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

async function testPendingCycles() {
  console.log('\n🧪 TEST: pending_cycles Increment & Auto-Cancellation\n');
  
  try {
    // Reset database
    console.log('📋 STEP 0: Reset database...');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma migrate reset --force', {
        stdio: 'pipe',
        cwd: __dirname + '/../../'
      });
      execSync('node prisma/seed.js', {
        stdio: 'pipe',
        cwd: __dirname + '/../../'
      });
      console.log('  ✅ Database reset');
    } catch (err) {
      console.log('  ⚠️  Could not reset (may already be clean)');
    }

    // Create a single ride request (won't match with itself)
    console.log('\n📝 STEP 1: Creating single ride request...');
    
    // Get the first test user
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No test users found - database may not be seeded');
    }
    const userId = user.id;

    const createResponse = await axios.post(`${BASE_URL}/ride-requests`, {
      pickupLat: 30.3525,
      pickupLng: 76.3616,
      dropLat: 30.6942,
      dropLng: 76.8606,
      preferredTime: '2026-04-20T18:30:00Z',
    }, {
      headers: { 'x-user-id': userId }
    });

    if (!createResponse.data.success) {
      throw new Error('Failed to create ride request');
    }

    const rideRequestId = createResponse.data.data.id;
    console.log(`  ✅ Created request: ${rideRequestId.substring(0, 8)}`);

    // Run matching 5 times
    console.log('\n⚙️  STEP 2: Running matching 5 cycles...\n');
    const cycleResults = [];

    for (let cycle = 1; cycle <= 5; cycle++) {
      console.log(`  Cycle ${cycle}:`);

      // Run matching
      const matchResponse = await axios.post(`${BASE_URL}/admin/run-matching`);
      if (!matchResponse.data.success) {
        throw new Error(`Matching failed at cycle ${cycle}`);
      }

      // Check the request state
      const request = await prisma.rideRequest.findUnique({
        where: { id: rideRequestId }
      });

      cycleResults.push({
        cycle,
        pendingCycles: request.pendingCycles,
        status: request.status
      });

      console.log(`    • pendingCycles: ${request.pendingCycles}`);
      console.log(`    • status: ${request.status}`);
    }

    // Verify results
    console.log('\n📊 STEP 3: Validating results...\n');

    let testPassed = true;
    const expectedResults = [
      { cycle: 1, pendingCycles: 1, status: 'PENDING' },
      { cycle: 2, pendingCycles: 2, status: 'PENDING' },
      { cycle: 3, pendingCycles: 3, status: 'PENDING' },
      { cycle: 4, pendingCycles: 4, status: 'PENDING' },
      { cycle: 5, pendingCycles: 5, status: 'CANCELLED' }
    ];

    for (let i = 0; i < cycleResults.length; i++) {
      const actual = cycleResults[i];
      const expected = expectedResults[i];

      const cycleMatch = actual.cycle === expected.cycle;
      const cyclesMatch = actual.pendingCycles === expected.pendingCycles;
      const statusMatch = actual.status === expected.status;

      const passed = cycleMatch && cyclesMatch && statusMatch;

      console.log(`  Cycle ${actual.cycle}:`);
      console.log(`    ✓ pendingCycles: ${actual.pendingCycles} (expected ${expected.pendingCycles}) ${cyclesMatch ? '✓' : '❌'}`);
      console.log(`    ✓ status: ${actual.status} (expected ${expected.status}) ${statusMatch ? '✓' : '❌'}`);

      if (!passed) testPassed = false;
    }

    // Final verdict
    console.log('\n🎯 TEST RESULT:');
    if (testPassed) {
      console.log('  ✅ SUCCESS - pending_cycles logic is working correctly');
      console.log('     • Cycles 1-4: Correctly incremented');
      console.log('     • Cycle 5: Correctly auto-cancelled at threshold\n');
      return true;
    } else {
      console.log('  ❌ FAILED - pending_cycles logic has issues\n');
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
testPendingCycles()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
