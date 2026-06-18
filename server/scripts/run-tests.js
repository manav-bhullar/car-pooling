#!/usr/bin/env node

/**
 * Test Runner
 * Executes E2E tests with clear output
 */

const { execSync } = require('child_process');

console.log('\n🧪 RUNNING E2E TESTS\n');
console.log('Prerequisites:');
console.log('  1. Server running on port 5050');
console.log('  2. Database seeded with test users');
console.log('  3. Clean state (run: npx prisma migrate reset && node prisma/seed.js)\n');

try {
  console.log('─'.repeat(60));
  require('../tests/e2e.test.js').runE2ETest()
    .then(passed => {
      console.log('─'.repeat(60));
      if (passed) {
        console.log('\n✅ All tests passed\n');
        process.exit(0);
      } else {
        console.log('\n❌ Tests failed\n');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Test runner error:', err);
      process.exit(1);
    });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
