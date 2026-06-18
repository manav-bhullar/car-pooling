// tests/matching-still-works.test.js
const prisma = require('../src/prisma/client');
const { runMatchingCycle } = require('../src/modules/integrations/matchingIntegration');

(async () => {
  console.log("TEST: matching still works");

  const user1 = await prisma.user.create({
    data: { email: "m1@test.com", name: "User1" }
  });

  const user2 = await prisma.user.create({
    data: { email: "m2@test.com", name: "User2" }
  });

  const now = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.rideRequest.createMany({
    data: [
      {
        userId: user1.id,
        pickupLat: 30,
        pickupLng: 76,
        dropLat: 30.5,
        dropLng: 76.5,
        preferredTime: now
      },
      {
        userId: user2.id,
        pickupLat: 30.01,
        pickupLng: 76.01,
        dropLat: 30.5,
        dropLng: 76.5,
        preferredTime: now
      }
    ]
  });

  await runMatchingCycle("TEST");

  const trips = await prisma.trip.findMany();

  if (trips.length === 0) {
    throw new Error("❌ Matching broken");
  }

  console.log("✅ Passed");
  process.exit(0);
})();