const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create 5 test users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@test.com' },
      update: {},
      create: {
        name: 'Alice',
        email: 'alice@test.com',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@test.com' },
      update: {},
      create: {
        name: 'Bob',
        email: 'bob@test.com',
      },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@test.com' },
      update: {},
      create: {
        name: 'Charlie',
        email: 'charlie@test.com',
      },
    }),
    prisma.user.upsert({
      where: { email: 'diana@test.com' },
      update: {},
      create: {
        name: 'Diana',
        email: 'diana@test.com',
      },
    }),
    prisma.user.upsert({
      where: { email: 'eve@test.com' },
      update: {},
      create: {
        name: 'Eve',
        email: 'eve@test.com',
      },
    }),
  ]);

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
