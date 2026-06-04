const { PrismaClient } = require('@prisma/client');
const { calculatePassengerMetrics } = require('../src/modules/trip/trip.utils');

(async function() {
  const prisma = new PrismaClient();
  try {
    const trip = await prisma.trip.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        tripUsers: {
          include: { user: true },
        },
        tripStops: true,
      },
    });

    if (!trip) {
      console.error('No active trip found');
      process.exit(1);
    }

    // Build stops as serialized by controller
    const stops = (trip.tripStops || []).slice().sort((a, b) => a.stopOrder - b.stopOrder).map(s => ({
      stopOrder: s.stopOrder,
      type: s.type,
      lat: s.lat,
      lng: s.lng,
      rideRequestId: s.rideRequestId,
      segmentDistKm: s.segmentDistKm,
      activePassengersOnSegment: s.activePassengersOnSegment,
    }));

    const passengers = trip.tripUsers.map(tu => ({
      userId: tu.userId,
      name: tu.user?.name,
      rideRequestId: tu.rideRequestId,
      fareShare: Math.round((tu.fareShare + Number.EPSILON) * 100) / 100,
    }));

    const output = {
      id: trip.id,
      totalDistanceKm: trip.totalDistanceKm,
      estimatedEtaMinutes: trip.estimatedEtaMinutes,
      passengers: passengers.map(p => {
        const m = calculatePassengerMetrics(stops, p.rideRequestId);
        return {
          ...p,
          distanceKm: Number((m.distanceKm || 0).toFixed(6)),
          etaMinutes: m.etaMinutes,
        };
      }),
      stops,
    };

    console.log(JSON.stringify(output, null, 2));

    // Manual verification: recompute distances from stops for each passenger and compare
    console.log('\nManual verification (sum legs from stops):');
    for (const p of output.passengers) {
      const pickup = stops.find(s => s.rideRequestId === p.rideRequestId && s.type === 'PICKUP');
      const dropoff = stops.find(s => s.rideRequestId === p.rideRequestId && s.type === 'DROPOFF');
      if (!pickup || !dropoff) {
        console.log(`- ${p.name || p.userId}: missing pickup/dropoff`);
        continue;
      }
      const pickupOrder = pickup.stopOrder; const dropoffOrder = dropoff.stopOrder;
      let manual = 0;
      for (const s of stops) {
        if (s.stopOrder > pickupOrder && s.stopOrder <= dropoffOrder) manual += Number(s.segmentDistKm) || 0;
      }
      const manualRounded = Number(manual.toFixed(6));
      console.log(`- ${p.name || p.userId}: serialized.distanceKm=${p.distanceKm}, manual=${manualRounded}, match=${Math.abs(p.distanceKm - manualRounded) < 1e-6}`);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error running audit script:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
