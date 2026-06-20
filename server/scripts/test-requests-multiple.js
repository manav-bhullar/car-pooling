const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRequests() {
  const users = [
    { id: '3dfef256-ab60-43d3-87b5-d7d92d892cee', name: 'Alice', email: 'alice@test.com' },
    { id: '781ddfe3-32fc-4d44-8fce-16f3919ab539', name: 'Bob',   email: 'bob@test.com'   },
    { id: 'f7a1ff75-580b-4cb5-8da0-427f1cb89bfe', name: 'Charlie', email: 'charlie@test.com' },
    { id: '575b4a62-faeb-47c4-962c-70bf53d0130e', name: 'Diana', email: 'diana@test.com' },
    { id: 'c7597b03-65c2-4a14-94c2-d7bc3aef61b0', name: 'Eve',   email: 'eve@test.com'   },
  ];

  // Create a 6th user just for this test
  const frank = await prisma.user.upsert({
    where: { email: 'frank@test.com' },
    update: {},
    create: {
      name: 'Frank',
      email: 'frank@test.com',
      password: 'password123',
      isVerified: true
    }
  });

  users.push(frank);

  // GROUP 1: San Francisco Financial District bound (3 users)
  const group1Pickup = { lat: 37.7749, lng: -122.4194 }; // Civic Center
  const group1Drop = { lat: 37.7899, lng: -122.4004 }; // Fin District

  for (let i = 0; i < 3; i++) {
    await prisma.rideRequest.create({
      data: {
        userId: users[i].id,
        pickupLat: group1Pickup.lat + (Math.random() * 0.002),
        pickupLng: group1Pickup.lng + (Math.random() * 0.002),
        pickupAddress: `Group 1 Pickup ${i+1}`,
        dropLat: group1Drop.lat + (Math.random() * 0.002),
        dropLng: group1Drop.lng + (Math.random() * 0.002),
        dropAddress: `Group 1 Drop ${i+1}`,
        status: 'PENDING',
        preferredTime: new Date()
      }
    });
  }

  // GROUP 2: San Francisco Mission District bound (3 users)
  const group2Pickup = { lat: 37.7600, lng: -122.4350 }; // Castro area
  const group2Drop = { lat: 37.7599, lng: -122.4148 }; // Mission District

  for (let i = 3; i < 6; i++) {
    await prisma.rideRequest.create({
      data: {
        userId: users[i].id,
        pickupLat: group2Pickup.lat + (Math.random() * 0.002),
        pickupLng: group2Pickup.lng + (Math.random() * 0.002),
        pickupAddress: `Group 2 Pickup ${i-2}`,
        dropLat: group2Drop.lat + (Math.random() * 0.002),
        dropLng: group2Drop.lng + (Math.random() * 0.002),
        dropAddress: `Group 2 Drop ${i-2}`,
        status: 'PENDING',
        preferredTime: new Date()
      }
    });
  }

  console.log('✅ Created 6 ride requests (2 distinct groups of 3)');
}

createRequests().catch(console.error).finally(() => prisma.$disconnect());
