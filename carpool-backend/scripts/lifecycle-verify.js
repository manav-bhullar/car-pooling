const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE = 'http://localhost:5050/api';

(async function(){
  const prisma = new PrismaClient();
  try{
    console.log('Starting lifecycle verification script');

    // Get test users
    const users = await prisma.user.findMany({ where: { email: { in: ['alice@test.com','bob@test.com','charlie@test.com'] } } });
    if (users.length < 3) {
      console.error('Test users not found, ensure DB seeded');
      process.exit(2);
    }
    const [alice,bob,charlie] = users;

    // Prepare times
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const baseTime = new Date(tomorrow);
    baseTime.setHours(18,30,0,0);

    const requests = [
      { user: alice, body: { pickupLat:30.3525, pickupLng:76.3616, dropLat:30.6942, dropLng:76.8606, preferredTime: baseTime.toISOString() } },
      { user: bob, body: { pickupLat:30.3530, pickupLng:76.3620, dropLat:30.6940, dropLng:76.8600, preferredTime: new Date(baseTime.getTime()+2*60000).toISOString() } },
      { user: charlie, body: { pickupLat:30.3527, pickupLng:76.3618, dropLat:30.6945, dropLng:76.8610, preferredTime: new Date(baseTime.getTime()+1*60000).toISOString() } },
    ];

    // Create ride requests via API
    const reqIds = [];
    for (const r of requests) {
      const res = await axios.post(`${BASE}/ride-requests`, r.body, { headers: { 'x-user-id': r.user.id } });
      if (!res.data.success) throw new Error('Failed to create ride request: '+JSON.stringify(res.data));
      reqIds.push(res.data.data.id);
      console.log('Created request', res.data.data.id, 'for', r.user.email);
    }

    // Trigger matching
    console.log('Triggering matching...');
    const matchRes = await axios.post(`${BASE}/admin/run-matching`);
    if (!matchRes.data.success) throw new Error('run-matching failed: '+JSON.stringify(matchRes.data));
    console.log('Matching result:', matchRes.data.data);

    // Find latest trip
    const trip = await prisma.trip.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!trip) throw new Error('No trip found after matching');

    console.log('Trip id:', trip.id, 'status:', trip.status);

    const tripUsers = await prisma.tripUser.findMany({ where: { tripId: trip.id } });
    console.log('Trip users:', tripUsers.map(t=>({userId:t.userId, rideRequestId:t.rideRequestId, fareShare:t.fareShare}))); 

    const rrBefore = await prisma.rideRequest.findMany({ where: { id: { in: tripUsers.map(t=>t.rideRequestId) } }, select: { id:true, status:true } });
    console.log('RideRequests before complete:', rrBefore);

    // Call complete endpoint as participant
    const participant = tripUsers[0].userId;
    console.log('Calling complete as participant', participant);
    const completeRes = await axios.post(`${BASE}/trips/${trip.id}/complete`, {}, { headers: { 'x-user-id': participant } });
    console.log('Complete response:', completeRes.data);

    const rrAfter = await prisma.rideRequest.findMany({ where: { id: { in: tripUsers.map(t=>t.rideRequestId) } }, select: { id:true, status:true } });
    console.log('RideRequests after complete:', rrAfter);

    // Validate: rideRequests should remain MATCHED
    const notMatched = rrAfter.filter(r => r.status !== 'MATCHED');
    if (notMatched.length > 0) {
      console.error('ERROR: Some rideRequests changed status:', notMatched);
      process.exit(4);
    }

    console.log('SUCCESS: rideRequests remain MATCHED after trip completion');
    process.exit(0);
  }catch(err){
    console.error('Lifecycle verify error:', err.response ? err.response.data : err.message);
    process.exit(1);
  }finally{
    await prisma.$disconnect();
  }
})();
