// tests/no-overcancel.test.js
const prisma = require('../src/prisma/client');
const { runMatchingCycle } = require('../src/modules/integrations/matchingIntegration');

(async () => {
  console.log("TEST: no over-cancellation");

  const user = await prisma.user.create({
    data: { email: "safe@test.com", name: "Safe User" }
  });

  const request = await prisma.rideRequest.create({
    data: {
      userId: user.id,
      pickupLat: 30,
      pickupLng: 76,
      dropLat: 30.5,
      dropLng: 76.5,
      preferredTime: new Date(Date.now() + 10 * 60 * 1000),
      pendingCycles: 0
    }
  });

  await runMatchingCycle("TEST");

  const updated = await prisma.rideRequest.findUnique({ where: { id: request.id } });

  if (updated.status !== "PENDING") {
    throw new Error("❌ Over-cancellation bug");
  }

  console.log("✅ Passed");
  process.exit(0);
})();