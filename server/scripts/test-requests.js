const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRequests() {
  const aliceId = '3dfef256-ab60-43d3-87b5-d7d92d892cee';
  const bobId = '781ddfe3-32fc-4d44-8fce-16f3919ab539';

  // Similar route in San Francisco or local city. Let's use generic close points.
  const pickup1 = { lat: 37.7749, lng: -122.4194, address: 'Civic Center' };
  const drop1 = { lat: 37.7899, lng: -122.4004, address: 'Financial District' };

  const pickup2 = { lat: 37.7755, lng: -122.4180, address: 'UN Plaza' }; // Very close to pickup1
  const drop2 = { lat: 37.7910, lng: -122.3990, address: 'Embarcadero' }; // Very close to drop1

  await prisma.rideRequest.create({
    data: {
      userId: aliceId,
      pickupLat: pickup1.lat,
      pickupLng: pickup1.lng,
      pickupAddress: pickup1.address,
      dropLat: drop1.lat,
      dropLng: drop1.lng,
      dropAddress: drop1.address,
      status: 'PENDING',
      preferredTime: new Date()
    }
  });

  await prisma.rideRequest.create({
    data: {
      userId: bobId,
      pickupLat: pickup2.lat,
      pickupLng: pickup2.lng,
      pickupAddress: pickup2.address,
      dropLat: drop2.lat,
      dropLng: drop2.lng,
      dropAddress: drop2.address,
      status: 'PENDING',
      preferredTime: new Date()
    }
  });

  console.log('✅ Created 2 ride requests for Alice and Bob');
}

createRequests().catch(console.error).finally(() => prisma.$disconnect());
