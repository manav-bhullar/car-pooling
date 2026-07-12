// tests/cycle-cancel.test.js
const prisma = require('../src/prisma/client');
const { runMatchingCycle } = require('../src/modules/integrations/matchingIntegration');

(async () => {
  console.log("TEST: cycle-based cancellation");

  // create user
  const user = await prisma.user.create({
    data: { email: "cycle@test.com", name: "Cycle User" }
  });

  // create request with pendingCycles = 19
  const request = await prisma.rideRequest.create({
    data: {
      userId: user.id,
      pickupLat: 30,
      pickupLng: 76,
      dropLat: 30.5,
      dropLng: 76.5,
      preferredTime: new Date(Date.now() + 10 * 60 * 1000), // future
      pendingCycles: 19
    }
  });

  await runMatchingCycle("TEST");

  const updated = await prisma.rideRequest.findUnique({ where: { id: request.id } });

  if (updated.status !== "CANCELLED") {
    throw new Error("❌ Cycle cancel failed");
  }

  console.log("✅ Passed");
  process.exit(0);
})();