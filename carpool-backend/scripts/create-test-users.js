const prisma = require('../src/prisma/client');

async function main() {
  try {
    await prisma.user.create({ data: { id: '11111111-1111-1111-1111-111111111111', name: 'User1', email: 'user1@example.com' } });
    await prisma.user.create({ data: { id: '22222222-2222-2222-2222-222222222222', name: 'User2', email: 'user2@example.com' } });
    await prisma.user.create({ data: { id: '33333333-3333-3333-3333-333333333333', name: 'User3', email: 'user3@example.com' } });
    console.log('created test users');
  } catch (e) {
    console.error('error creating users', e.message || e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
