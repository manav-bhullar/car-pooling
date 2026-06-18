const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

(async function run() {
  const prisma = new PrismaClient();
  try {
    const trip = await prisma.trip.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!trip) {
      console.error('No trip found');
      process.exit(2);
    }

    const tripUsers = await prisma.tripUser.findMany({ where: { tripId: trip.id } });
    if (!tripUsers || tripUsers.length === 0) {
      console.error('No trip users found');
      process.exit(2);
    }

    const participant = tripUsers[0].userId;

    console.log('TRIP_ID', trip.id);
    console.log('PARTICIPANT', participant);
    console.log('TRIP_STATUS_BEFORE_COMPLETE', trip.status, 'completedAt:', trip.completedAt);

    // Call complete endpoint
    try {
      const res = await axios.post(`http://localhost:5050/api/trips/${trip.id}/complete`, {}, {
        headers: { 'x-user-id': participant },
      });
      console.log('COMPLETE_RESPONSE', JSON.stringify(res.data));
    } catch (err) {
      if (err.response) console.error('COMPLETE_ERROR', err.response.status, err.response.data);
      else console.error('COMPLETE_ERROR', err.message);
      process.exit(3);
    }

    // Inspect ride requests for this trip
    const rideRequestIds = tripUsers.map((tu) => tu.rideRequestId).filter(Boolean);
    const reqs = await prisma.rideRequest.findMany({ where: { id: { in: rideRequestIds } }, select: { id: true, status: true } });
    console.log('RIDE_REQUESTS', JSON.stringify(reqs, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
