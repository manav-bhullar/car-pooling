const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('\n=== RIDE REQUESTS ===');
    const requests = await prisma.rideRequest.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        status: true,
        pendingCycles: true,
        createdAt: true,
      },
    });
    console.table(requests);

    console.log('\n=== TRIPS ===');
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tripUsers: {
          select: {
            userId: true,
            rideRequestId: true,
          },
        },
        tripStops: {
          select: {
            stopOrder: true,
            type: true,
            lat: true,
            lng: true,
            rideRequestId: true,
            segmentDistKm: true,
            activePassengersOnSegment: true,
          },
        },
      },
    });

    trips.forEach((trip, i) => {
      console.log(`\nTrip ${i + 1}: ${trip.id}`);
      console.log(`  Status: ${trip.status}`);
      console.log(`  Distance: ${trip.totalDistanceKm} km`);
      console.log(`  ETA: ${trip.estimatedEtaMinutes} min`);
      console.log(`  Users: ${trip.tripUsers.length}`);
      trip.tripUsers.forEach(u => {
        console.log(`    - User: ${u.userId}, Request: ${u.rideRequestId}`);
      });
      console.log(`  Stops: ${trip.tripStops.length}`);
      trip.tripStops.forEach(s => {
        console.log(`    - ${s.stopOrder}: ${s.type.toUpperCase()} (${s.lat}, ${s.lng}) | Segment: ${s.segmentDistKm.toFixed(2)}km | Active: ${s.activePassengersOnSegment}`);
      });
    });

    console.log('\n=== SUMMARY ===');
    const matchedCount = requests.filter(r => r.status === 'MATCHED').length;
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const cancelledCount = requests.filter(r => r.status === 'CANCELLED').length;

    console.log(`✅ Trips Created: ${trips.length}`);
    console.log(`✅ Users Matched: ${matchedCount}`);
    console.log(`⏳ Users Still Pending: ${pendingCount}`);
    console.log(`❌ Users Cancelled: ${cancelledCount}`);
    console.log(`📊 Total Requests: ${requests.length}`);

    // Check for duplicates within each trip (same user shouldn't appear twice in one trip)
    let hasDuplicates = false;
    trips.forEach((trip, tripIdx) => {
      const userIds = trip.tripUsers.map(u => u.userId);
      const uniqueUsers = new Set(userIds);
      if (uniqueUsers.size !== userIds.length) {
        console.log(`\n⚠️  DUPLICATE in Trip ${tripIdx + 1}: Same user appears twice!`);
        hasDuplicates = true;
      }
    });

    if (!hasDuplicates && trips.length > 0) {
      console.log(`\n✅ No duplicates within trips (each user appears once per trip)`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
