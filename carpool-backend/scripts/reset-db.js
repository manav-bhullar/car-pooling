#!/usr/bin/env node

/**
 * Quick Reset Script
 * Resets database to clean state with test users
 * 
 * Usage:
 *   node scripts/reset-db.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n⚠️  RESETTING DATABASE\n');

try {
  console.log('1. Running migrations reset...');
  execSync('npx prisma migrate reset --force', {
    cwd: path.dirname(__dirname),
    stdio: 'inherit',
  });

  console.log('\n2. Seeding test data...');
  execSync('node prisma/seed.js', {
    cwd: path.dirname(__dirname),
    stdio: 'inherit',
  });

  console.log('\n✅ Database reset complete\n');
  console.log('State:');
  console.log('  • 5 test users created');
  console.log('  • 0 ride requests');
  console.log('  • 0 trips');
  console.log('\nReady for testing!\n');
} catch (error) {
  console.error('\n❌ Reset failed:', error.message);
  process.exit(1);
}
