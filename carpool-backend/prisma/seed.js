const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Frontend user IDs (from carpool-frontend/src/constants/users.js)
  const SEEDED_USERS = [
    { id: '3dfef256-ab60-43d3-87b5-d7d92d892cee', name: 'Alice', email: 'alice@test.com' },
    { id: '781ddfe3-32fc-4d44-8fce-16f3919ab539', name: 'Bob',   email: 'bob@test.com'   },
    { id: 'f7a1ff75-580b-4cb5-8da0-427f1cb89bfe', name: 'Charlie', email: 'charlie@test.com' },
    { id: '575b4a62-faeb-47c4-962c-70bf53d0130e', name: 'Diana', email: 'diana@test.com' },
    { id: 'c7597b03-65c2-4a14-94c2-d7bc3aef61b0', name: 'Eve',   email: 'eve@test.com'   },
  ];

  // Create 5 test users
  const users = await Promise.all(
    SEEDED_USERS.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    )
  );

  console.log('✅ Created 5 test users:');
  users.forEach((user) => {
    console.log(`   - ${user.name} (${user.id})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
