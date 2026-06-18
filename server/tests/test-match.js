const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://localhost:5050/api';

const SCENARIOS = {
  'patiala-to-sangrur': {
    pickup: { lat: 30.3525, lng: 76.3616, address: 'Thapar, Patiala' },
    drop:   { lat: 30.2361, lng: 75.8422, address: 'Sangrur' },
  },
  'patiala-to-barnala': {
    pickup: { lat: 30.3530, lng: 76.3620, address: 'Thapar, Patiala' },
    drop:   { lat: 30.3782, lng: 75.5477, address: 'Barnala' },
  },
  'patiala-to-rajpura': {
    pickup: { lat: 30.3527, lng: 76.3618, address: 'Thapar, Patiala' },
    drop:   { lat: 30.4817, lng: 76.5955, address: 'Rajpura' },
  },
};

async function seed(scenarioKeys) {
  const users = await prisma.user.findMany({ take: scenarioKeys.length });
  const preferredTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  console.log(`\nCreating ${scenarioKeys.length} ride requests...\n`);

  for (let i = 0; i < scenarioKeys.length; i++) {
    const scenario = SCENARIOS[scenarioKeys[i]];
    const user = users[i];

    const res = await axios.post(`${BASE}/ride-requests`, {
      pickupLat:     scenario.pickup.lat,
      pickupLng:     scenario.pickup.lng,
      pickupAddress: scenario.pickup.address,
      dropLat:       scenario.drop.lat,
      dropLng:       scenario.drop.lng,
      dropAddress:   scenario.drop.address,
      preferredTime,
    }, { headers: { 'x-user-id': user.id } });

    console.log(`  ${user.name}: ${scenario.pickup.address} → ${scenario.drop.address}`);
    if (!res.data.success) {
      console.log(`  ERROR: ${res.data.error?.message}`);
    }
  }

  console.log('\nRunning matching cycle...\n');
  const match = await axios.post(`${BASE}/admin/run-matching`);
  const d = match.data.data;
  console.log(`  Trips created:  ${d.trips_created}`);
  console.log(`  Users matched:  ${d.users_matched}`);
  console.log(`  Still pending:  ${d.users_still_pending}`);
  console.log(`  Auto-cancelled: ${d.auto_cancelled_count}`);
  console.log(`  Duration:       ${d.duration_ms}ms`);

  await prisma.$disconnect();
}

const args = process.argv.slice(2);
const keys = args.length > 0 ? args : Object.keys(SCENARIOS);
seed(keys).catch(console.error);