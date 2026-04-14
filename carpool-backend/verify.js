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
        console.log(`    - ${s.stopOrder}: ${s.type.toUpperCase()} (${s.lat}, ${s.lng})`);
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

    // Check for duplicates
    const userIds = new Set();
    let hasDuplicates = false;
    requests.forEach(r => {
      if (r.status === 'MATCHED') {
        if (userIds.has(r.userId)) {
          console.log(`\n⚠️  DUPLICATE: User ${r.userId} in multiple requests!`);
          hasDuplicates = true;
        }
        userIds.add(r.userId);
      }
    });

    if (!hasDuplicates && matchedCount > 0) {
      console.log(`\n✅ No duplicates found`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
