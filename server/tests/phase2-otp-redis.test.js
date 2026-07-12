/**
 * Phase 2 Verification — OTP & Rate Limiting via Redis
 * 
 * Tests:
 * 1. OTP storage in Redis (simulates register)
 * 2. OTP retrieval and verification (simulates verifyEmail)
 * 3. OTP auto-expiry via TTL
 * 4. Rate limiting for resend (60s cooldown)
 * 5. OTP overwrite on resend (old OTP becomes invalid)
 */

require('dotenv').config();
const { connectRedis, getRedis, disconnectRedis } = require('../src/utils/redis');

// Replicate the key helpers from auth.service.js
const OTP_KEY = (userId, type = 'EMAIL_VERIFY') => `otp:${userId}:${type}`;
const OTP_RATELIMIT_KEY = (userId) => `otp:ratelimit:${userId}`;

const TEST_USER_ID = 'test-user-phase2-' + Date.now();

async function run() {
  const redis = connectRedis();
  
  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 500));

  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${label}`);
      failed++;
    }
  }

  try {
    // ─── Test 1: Store OTP ───
    console.log('\n📦 Test 1: Store OTP in Redis');
    const otpCode = '654321';
    const otpTtlSeconds = 5; // Short TTL for testing expiry
    await redis.set(
      OTP_KEY(TEST_USER_ID),
      JSON.stringify({ code: otpCode, createdAt: new Date().toISOString() }),
      'EX',
      otpTtlSeconds
    );
    const stored = await redis.get(OTP_KEY(TEST_USER_ID));
    assert(stored !== null, 'OTP key exists in Redis');
    const parsed = JSON.parse(stored);
    assert(parsed.code === '654321', 'OTP code matches');
    assert(parsed.createdAt !== undefined, 'createdAt timestamp present');

    // ─── Test 2: Verify OTP (correct code) ───
    console.log('\n🔐 Test 2: Verify OTP (correct code)');
    const otpData = await redis.get(OTP_KEY(TEST_USER_ID));
    const { code: storedCode } = JSON.parse(otpData);
    assert(storedCode === otpCode, 'Stored code matches input');

    // Simulate successful verify — delete key
    await redis.del(OTP_KEY(TEST_USER_ID));
    const afterDelete = await redis.get(OTP_KEY(TEST_USER_ID));
    assert(afterDelete === null, 'OTP key deleted after verification');

    // ─── Test 3: Verify OTP (not found / expired) ───
    console.log('\n⏰ Test 3: OTP not found after deletion');
    const notFound = await redis.get(OTP_KEY(TEST_USER_ID));
    assert(notFound === null, 'No OTP found (simulates expired/used)');

    // ─── Test 4: OTP auto-expiry via TTL ───
    console.log('\n⏱️  Test 4: OTP auto-expiry (2s TTL)');
    await redis.set(
      OTP_KEY(TEST_USER_ID),
      JSON.stringify({ code: '111111', createdAt: new Date().toISOString() }),
      'EX',
      2 // 2 second TTL
    );
    const beforeExpiry = await redis.get(OTP_KEY(TEST_USER_ID));
    assert(beforeExpiry !== null, 'OTP exists before TTL expires');
    
    console.log('    Waiting 2.5 seconds for TTL...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const afterExpiry = await redis.get(OTP_KEY(TEST_USER_ID));
    assert(afterExpiry === null, 'OTP auto-expired after TTL');

    // ─── Test 5: Rate limiting (resend cooldown) ───
    console.log('\n🚦 Test 5: Rate limiting (resend cooldown)');
    const rateLimitKey = OTP_RATELIMIT_KEY(TEST_USER_ID);
    
    // Set rate limit (simulate resend)
    await redis.set(rateLimitKey, '1', 'EX', 3); // 3s for testing
    
    const isRateLimited = await redis.exists(rateLimitKey);
    assert(isRateLimited === 1, 'Rate limit key exists (blocked)');
    
    const ttl = await redis.ttl(rateLimitKey);
    assert(ttl > 0 && ttl <= 3, `TTL is ${ttl}s (between 1-3s)`);
    
    console.log('    Waiting 3.5 seconds for cooldown...');
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    const afterCooldown = await redis.exists(rateLimitKey);
    assert(afterCooldown === 0, 'Rate limit expired (unblocked)');

    // ─── Test 6: OTP overwrite (resend replaces old OTP) ───
    console.log('\n🔄 Test 6: OTP overwrite on resend');
    await redis.set(
      OTP_KEY(TEST_USER_ID),
      JSON.stringify({ code: '111111', createdAt: new Date().toISOString() }),
      'EX',
      600
    );
    // Simulate resend with new code
    await redis.set(
      OTP_KEY(TEST_USER_ID),
      JSON.stringify({ code: '222222', createdAt: new Date().toISOString() }),
      'EX',
      600
    );
    const overwritten = JSON.parse(await redis.get(OTP_KEY(TEST_USER_ID)));
    assert(overwritten.code === '222222', 'New OTP overwrites old one');
    assert(overwritten.code !== '111111', 'Old OTP code is gone');

    // Cleanup
    await redis.del(OTP_KEY(TEST_USER_ID));

  } catch (err) {
    console.error('\n💥 Test error:', err);
    failed++;
  }

  // ─── Summary ───
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('Phase 2 verification: ALL PASSED ✅');
  } else {
    console.log('Phase 2 verification: SOME FAILED ❌');
  }

  await disconnectRedis();
  process.exit(failed > 0 ? 1 : 0);
}

run();
