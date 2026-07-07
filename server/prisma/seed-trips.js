const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.findUnique({ where: { email: 'alice@test.com' } });
  const bob = await prisma.user.findUnique({ where: { email: 'bob@test.com' } });

  if (!alice || !bob) {
    console.error('Test users not found. Run seed first.');
    return;
  }

  // Clear existing to avoid conflicts
  await prisma.tripUser.deleteMany({});
  await prisma.tripStop.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.rideRequest.deleteMany({});

  // 1. Setup Active Trip for Alice (Trip Matched Screen)
  const aliceReq = await prisma.rideRequest.create({
    data: {
      userId: alice.id,
      pickupLat: 30.0, pickupLng: 76.0,
      dropLat: 30.1, dropLng: 76.1,
      pickupAddress: 'Pickup A',
      dropAddress: 'Drop A',
      preferredTime: new Date(),
      status: 'RIDERS_MATCHED',
    }
  });

  const activeTrip = await prisma.trip.create({
    data: {
      status: 'RIDERS_MATCHED',
      totalDistanceKm: 15.5,
      estimatedEtaMinutes: 25,
      detourRatio: 0.1,
      tripUsers: {
        create: [
          { userId: alice.id, rideRequestId: aliceReq.id, fareShare: 120 }
        ]
      }
    }
  });

  // 2. Setup Completed Trip for Bob (Summary Screen)
  const bobReq = await prisma.rideRequest.create({
    data: {
      userId: bob.id,
      pickupLat: 30.0, pickupLng: 76.0,
      dropLat: 30.1, dropLng: 76.1,
      pickupAddress: 'Pickup B',
      dropAddress: 'Drop B',
      preferredTime: new Date(Date.now() - 3600000),
      status: 'COMPLETED',
    }
  });

  const completedTrip = await prisma.trip.create({
    data: {
      status: 'COMPLETED',
      totalDistanceKm: 20.2,
      estimatedEtaMinutes: 30,
      detourRatio: 0.05,
      completedAt: new Date(),
      tripUsers: {
        create: [
          { userId: bob.id, rideRequestId: bobReq.id, fareShare: 150 }
        ]
      }
    }
  });

  console.log('✅ Created Active Trip for Alice (alice@test.com)');
  console.log('✅ Created Completed Trip for Bob (bob@test.com)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
