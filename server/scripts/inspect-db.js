#!/usr/bin/env node

/**
 * Quick DB Inspector
 * Shows current state: users, requests, trips, matching logs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectDB() {
  try {
    console.log('\n📊 DATABASE STATE INSPECTION\n');

    // Users
    const userCount = await prisma.user.count();
    console.log(`👤 Users: ${userCount}`);
    
    // Requests
    const requests = await prisma.rideRequest.findMany({
      select: { id: true, userId: true, status: true, pendingCycles: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`🚗 Recent Requests: ${await prisma.rideRequest.count()}`);
    if (requests.length > 0) {
      console.table(requests.map(r => ({
        id: r.id.substring(0, 8),
        userId: r.userId.substring(0, 8),
        status: r.status,
        pendingCycles: r.pendingCycles,
      })));
    }

    // Trips
    const trips = await prisma.trip.findMany({
      select: { id: true, status: true, totalDistanceKm: true, estimatedEtaMinutes: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`\n✈️  Trips: ${await prisma.trip.count()}`);
    if (trips.length > 0) {
      console.table(trips.map(t => ({
        id: t.id.substring(0, 8),
        status: t.status,
        distance: t.totalDistanceKm.toFixed(2),
        eta: t.estimatedEtaMinutes,
      })));
    }

    // Last matching cycle
    const lastCycle = await prisma.matchCycleLog.findFirst({
      orderBy: { runAt: 'desc' },
    });
    console.log(`\n⏱️  Last Matching Cycle:`);
    if (lastCycle) {
      console.log(`  • Ran at: ${lastCycle.runAt.toISOString()}`);
      console.log(`  • Duration: ${lastCycle.durationMs}ms`);
      console.log(`  • Trips created: ${lastCycle.tripsCreated}`);
      console.log(`  • Users matched: ${lastCycle.usersMatched}`);
      console.log(`  • Still pending: ${lastCycle.usersStillPending}`);
      console.log(`  • Error: ${lastCycle.errorMessage || 'None'}`);
    } else {
      console.log('  No cycles run yet');
    }

    console.log();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDB();
