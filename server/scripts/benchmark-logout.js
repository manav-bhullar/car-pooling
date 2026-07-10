const { logout } = require('../src/modules/auth/auth.service');
const prisma = require('../src/prisma/client');
const bcrypt = require('bcrypt');

async function runBenchmark() {
  const userId = 'bench-user-' + Date.now();

  // Create a mock user
  await prisma.user.create({
    data: {
      id: userId,
      email: "bench" + Date.now() + "@example.com",
      name: 'Bench User',
      password: 'password123'
    }
  });

  const tokensToCreate = 5;
  const rawTokens = [];

  for (let i = 0; i < tokensToCreate; i++) {
    const rawToken = 'test_token_' + Date.now() + '_' + i;
    rawTokens.push(rawToken);
    const hashed = await bcrypt.hash(rawToken, 12);
    await prisma.refreshToken.create({
      data: {
        userId: userId,
        token: hashed,
        expiresAt: new Date(Date.now() + 100000)
      }
    });
  }

  const tokenToLogout = rawTokens[rawTokens.length - 1]; // The last token (worst case for linear search)

  console.log('Starting benchmark...');
  const start = performance.now();
  await logout(userId, tokenToLogout);
  const end = performance.now();

  console.log('Logout took ' + (end - start) + ' ms');

  // Cleanup
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

runBenchmark().catch(console.error).finally(() => process.exit(0));
