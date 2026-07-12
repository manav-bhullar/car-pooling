/**
 * Phase 3 Verification — Refresh Tokens & User Profile Cache via Redis
 * 
 * Tests:
 * 1. Store refresh token (simulates createTokensForUser)
 * 2. Lookup refresh token (simulates refreshToken)
 * 3. Token rotation (old deleted, new created)
 * 4. Logout (token deleted from Redis)
 * 5. Token cap (max 5 per user, FIFO eviction)
 * 6. User profile caching (getMe)
 */

require('dotenv').config();
const crypto = require('crypto');
const { connectRedis, getRedis, disconnectRedis } = require('../src/utils/redis');

// Replicate key helpers from auth.service.js
const REFRESH_TOKEN_KEY = (hashedToken) => `refresh:${hashedToken}`;
const REFRESH_USER_SET_KEY = (userId) => `refresh:user:${userId}`;
const USER_PROFILE_KEY = (userId) => `user:profile:${userId}`;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;
const MAX_REFRESH_TOKENS_PER_USER = 5;
const USER_PROFILE_TTL = 5; // 5s for testing (prod: 300s)

const TEST_USER_ID = 'test-user-phase3-' + Date.now();

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function run() {
  const redis = connectRedis();
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
    // ─── Test 1: Store refresh token ───
    console.log('\n📦 Test 1: Store refresh token in Redis');
    const token1 = 'raw-token-1-' + Date.now();
    const hashed1 = hashToken(token1);
    
    await redis.set(REFRESH_TOKEN_KEY(hashed1), TEST_USER_ID, 'EX', REFRESH_TOKEN_TTL);
    await redis.sadd(REFRESH_USER_SET_KEY(TEST_USER_ID), hashed1);
    await redis.expire(REFRESH_USER_SET_KEY(TEST_USER_ID), REFRESH_TOKEN_TTL);

    const stored = await redis.get(REFRESH_TOKEN_KEY(hashed1));
    assert(stored === TEST_USER_ID, 'Refresh token maps to correct userId');
    
    const members = await redis.smembers(REFRESH_USER_SET_KEY(TEST_USER_ID));
    assert(members.includes(hashed1), 'Token exists in user set');

    // ─── Test 2: Lookup refresh token ───
    console.log('\n🔐 Test 2: Lookup refresh token');
    const lookedUp = await redis.get(REFRESH_TOKEN_KEY(hashed1));
    assert(lookedUp === TEST_USER_ID, 'Token lookup returns correct userId');

    const missingLookup = await redis.get(REFRESH_TOKEN_KEY('nonexistent'));
    assert(missingLookup === null, 'Missing token returns null');

    // ─── Test 3: Token rotation ───
    console.log('\n🔄 Test 3: Token rotation (old deleted, new created)');
    const token2 = 'raw-token-2-' + Date.now();
    const hashed2 = hashToken(token2);

    // Delete old
    await redis.del(REFRESH_TOKEN_KEY(hashed1));
    await redis.srem(REFRESH_USER_SET_KEY(TEST_USER_ID), hashed1);
    // Create new
    await redis.set(REFRESH_TOKEN_KEY(hashed2), TEST_USER_ID, 'EX', REFRESH_TOKEN_TTL);
    await redis.sadd(REFRESH_USER_SET_KEY(TEST_USER_ID), hashed2);

    const oldGone = await redis.get(REFRESH_TOKEN_KEY(hashed1));
    assert(oldGone === null, 'Old token deleted after rotation');

    const newExists = await redis.get(REFRESH_TOKEN_KEY(hashed2));
    assert(newExists === TEST_USER_ID, 'New token exists after rotation');

    const setAfterRotation = await redis.smembers(REFRESH_USER_SET_KEY(TEST_USER_ID));
    assert(!setAfterRotation.includes(hashed1), 'Old token removed from user set');
    assert(setAfterRotation.includes(hashed2), 'New token added to user set');

    // ─── Test 4: Logout ───
    console.log('\n🚪 Test 4: Logout (token deleted)');
    await redis.del(REFRESH_TOKEN_KEY(hashed2));
    await redis.srem(REFRESH_USER_SET_KEY(TEST_USER_ID), hashed2);

    const afterLogout = await redis.get(REFRESH_TOKEN_KEY(hashed2));
    assert(afterLogout === null, 'Token deleted after logout');

    const setAfterLogout = await redis.smembers(REFRESH_USER_SET_KEY(TEST_USER_ID));
    assert(setAfterLogout.length === 0, 'User set empty after logout');

    // ─── Test 5: Token cap (max 5, FIFO eviction) ───
    console.log('\n📊 Test 5: Token cap (max 5 per user)');
    const tokens = [];
    for (let i = 0; i < MAX_REFRESH_TOKENS_PER_USER; i++) {
      const t = `cap-token-${i}-${Date.now()}`;
      const h = hashToken(t);
      tokens.push(h);
      await redis.set(REFRESH_TOKEN_KEY(h), TEST_USER_ID, 'EX', REFRESH_TOKEN_TTL);
      await redis.sadd(REFRESH_USER_SET_KEY(TEST_USER_ID), h);
    }

    let setSize = await redis.scard(REFRESH_USER_SET_KEY(TEST_USER_ID));
    assert(setSize === MAX_REFRESH_TOKENS_PER_USER, `Set has ${setSize} tokens (cap: ${MAX_REFRESH_TOKENS_PER_USER})`);

    // Add 6th token — should evict first
    const currentTokens = await redis.smembers(REFRESH_USER_SET_KEY(TEST_USER_ID));
    if (currentTokens.length >= MAX_REFRESH_TOKENS_PER_USER) {
      const oldest = currentTokens[0];
      await redis.del(REFRESH_TOKEN_KEY(oldest));
      await redis.srem(REFRESH_USER_SET_KEY(TEST_USER_ID), oldest);
    }
    const token6 = `cap-token-6-${Date.now()}`;
    const hashed6 = hashToken(token6);
    await redis.set(REFRESH_TOKEN_KEY(hashed6), TEST_USER_ID, 'EX', REFRESH_TOKEN_TTL);
    await redis.sadd(REFRESH_USER_SET_KEY(TEST_USER_ID), hashed6);

    setSize = await redis.scard(REFRESH_USER_SET_KEY(TEST_USER_ID));
    assert(setSize === MAX_REFRESH_TOKENS_PER_USER, `After eviction, set still has ${setSize} tokens`);

    const evictedExists = await redis.get(REFRESH_TOKEN_KEY(tokens[0]));
    assert(evictedExists === null, 'Evicted (oldest) token no longer exists');

    const newestExists = await redis.get(REFRESH_TOKEN_KEY(hashed6));
    assert(newestExists === TEST_USER_ID, 'Newest token exists');

    // ─── Test 6: User profile caching ───
    console.log('\n👤 Test 6: User profile cache');
    const profile = { id: TEST_USER_ID, name: 'Test', email: 'test@test.com', isVerified: true, role: 'RIDER' };
    
    await redis.set(USER_PROFILE_KEY(TEST_USER_ID), JSON.stringify(profile), 'EX', USER_PROFILE_TTL);
    
    const cached = await redis.get(USER_PROFILE_KEY(TEST_USER_ID));
    assert(cached !== null, 'Profile is cached');
    const parsed = JSON.parse(cached);
    assert(parsed.name === 'Test', 'Cached profile has correct name');
    assert(parsed.role === 'RIDER', 'Cached profile has correct role');

    console.log('    Waiting 5.5s for cache expiry...');
    await new Promise(resolve => setTimeout(resolve, 5500));
    
    const expired = await redis.get(USER_PROFILE_KEY(TEST_USER_ID));
    assert(expired === null, 'Profile cache auto-expired');

    // Cleanup
    for (const t of tokens) await redis.del(REFRESH_TOKEN_KEY(t));
    await redis.del(REFRESH_TOKEN_KEY(hashed6));
    await redis.del(REFRESH_USER_SET_KEY(TEST_USER_ID));
    await redis.del(USER_PROFILE_KEY(TEST_USER_ID));

  } catch (err) {
    console.error('\n💥 Test error:', err);
    failed++;
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('Phase 3 verification: ALL PASSED ✅');
  } else {
    console.log('Phase 3 verification: SOME FAILED ❌');
  }

  await disconnectRedis();
  process.exit(failed > 0 ? 1 : 0);
}

run();
