// tests/time-overrides.test.js
const prisma = require('../src/prisma/client');
const { runMatchingCycle } = require('../src/modules/integrations/matchingIntegration');

(async () => {
  console.log("TEST: time overrides cycles");

  const user = await prisma.user.create({
    data: { email: "time@test.com", name: "Time User" }
  });

  const request = await prisma.rideRequest.create({
    data: {
      userId: user.id,
      pickupLat: 30,
      pickupLng: 76,
      dropLat: 30.5,
      dropLng: 76.5,
      preferredTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      pendingCycles: 1
    }
  });

  await runMatchingCycle("TEST");

  const updated = await prisma.rideRequest.findUnique({ where: { id: request.id } });

  if (updated.status !== "CANCELLED") {
    throw new Error("❌ Time override failed");
  }

  console.log("✅ Passed");
  process.exit(0);
})();