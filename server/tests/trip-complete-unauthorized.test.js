const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5050/api';
const prisma = new PrismaClient();

async function runTest() {
  console.log('\n🔒 Test: Non-participant cannot complete trip');
  try {
    const users = await prisma.user.findMany({
      where: { email: { in: ['alice@test.com','bob@test.com','charlie@test.com','diana@test.com'] } },
    });
    const map = {};
    users.forEach(u => map[u.email] = u.id);
    if (!map['alice@test.com'] || !map['bob@test.com'] || !map['charlie@test.com'] || !map['diana@test.com']) {
      throw new Error('Missing test users');
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const baseTime = new Date(tomorrow);
    baseTime.setHours(18,30,0,0);

    const requests = [
      { userId: map['alice@test.com'], body: { pickupLat: 30.3525, pickupLng: 76.3616, dropLat: 30.6942, dropLng: 76.8606, preferredTime: baseTime.toISOString() } },
      { userId: map['bob@test.com'],   body: { pickupLat: 30.3530, pickupLng: 76.3620, dropLat: 30.6940, dropLng: 76.8600, preferredTime: new Date(baseTime.getTime() + 2*60000).toISOString() } },
      { userId: map['charlie@test.com'], body: { pickupLat: 30.3527, pickupLng: 76.3618, dropLat: 30.6945, dropLng: 76.8610, preferredTime: new Date(baseTime.getTime() + 1*60000).toISOString() } },
    ];

    for (const r of requests) {
      const res = await axios.post(`${BASE_URL}/ride-requests`, r.body, { headers: { 'x-user-id': r.userId } });
      if (!res.data.success) throw new Error('Failed to create ride request: ' + JSON.stringify(res.data));
    }

    // Trigger matching
    const matchRes = await axios.post(`${BASE_URL}/admin/run-matching`);
    if (!matchRes.data.success) throw new Error('run-matching failed: ' + JSON.stringify(matchRes.data));

    // Find latest trip
    const trip = await prisma.trip.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!trip) throw new Error('No trip found after matching');

    // Attempt to complete trip as non-participant (diana)
    const nonParticipant = map['diana@test.com'];
    try {
      await axios.post(`${BASE_URL}/trips/${trip.id}/complete`, {}, { headers: { 'x-user-id': nonParticipant } });
      console.error('❌ FAIL: Non-participant was allowed to complete the trip');
      await prisma.$disconnect();
      process.exit(1);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ PASS: Non-participant got 403 Forbidden');
        await prisma.$disconnect();
        process.exit(0);
      }
      console.error('❌ FAIL: Unexpected error', err.response ? err.response.data : err.message);
      await prisma.$disconnect();
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err.message || err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

if (require.main === module) runTest();

module.exports = { runTest };
