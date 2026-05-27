const { runMatchingBatch } = require('../matching/matchingEngine');
const { createTripFromMatch } = require('../trip/trip.service');
const prisma = require('../../prisma/client');

/**
 * Fetch pending ride requests with database-level locking
 * FOR UPDATE SKIP LOCKED prevents race conditions when multiple schedulers run
 */
async function fetchPendingRequests(tx) {
  const requests = await tx.$queryRaw`
    SELECT * FROM "RideRequest"
    WHERE status = 'PENDING'
    FOR UPDATE SKIP LOCKED
  `;

  return requests;
}

/**
 * Update pending cycles for unmatched requests + auto-cancel stale ones
 * Returns { cycleCancelled, timeCancelled } for observability
 */
async function updatePendingCycles(tx, allRequests, matchedIds) {
  const unmatchedIds = allRequests
    .map(r => r.id)
    .filter(id => !matchedIds.has(id));

  if (unmatchedIds.length === 0) return { cycleCancelled: 0, timeCancelled: 0 };

  // 🔒 STEP 1: Increment pending cycles for unmatched PENDING requests ONLY
  // Prevents dirty updates if a request somehow becomes MATCHED/CANCELLED
  // ⚠️ CRITICAL: This must run BEFORE cancel logic
  await tx.rideRequest.updateMany({
    where: {
      id: { in: unmatchedIds },
      status: 'PENDING'  // ✅ CRITICAL: Only update PENDING requests
    },
    data: {
      pendingCycles: { increment: 1 }
    }
  });

  // 🔒 STEP 2: Auto-cancel by pending cycles (>= 20 cycles = ~20 min unmatched)
  const cutoffTime = new Date(Date.now() - 45 * 60 * 1000);
  
  const cycleCancelled = await tx.rideRequest.updateMany({
    where: {
      id: { in: unmatchedIds },
      status: 'PENDING',
      pendingCycles: { gte: 20 }
    },
    data: { status: 'CANCELLED' }
  });

  // 🔒 STEP 3: Auto-cancel by time (preferredTime > 45 min old)
  // Only affects PENDING requests (may have been cancelled in STEP 2)
  const timeCancelled = await tx.rideRequest.updateMany({
    where: {
      id: { in: unmatchedIds },
      status: 'PENDING',
      preferredTime: { lt: cutoffTime }
    },
    data: { status: 'CANCELLED' }
  });

  // ✅ Return counts for observability (enables debugging)
  console.log(`Auto-cancelled: cycles=${cycleCancelled.count} time=${timeCancelled.count}`);
  return { cycleCancelled: cycleCancelled.count, timeCancelled: timeCancelled.count };
}

/**
 * Log matching cycle to database
 */
async function logMatchingCycle(result, triggerType = 'CRON') {
  try {
    await prisma.matchCycleLog.create({
      data: {
        triggerType,
        pendingCountStart: result.pendingCountStart || 0,
        tripsCreated: result.tripsCreated || 0,
        usersMatched: result.usersMatched || 0,
        usersStillPending: result.usersStillPending || 0,
        autoCancelledCount: result.autoCancelledCount || 0,
        pairsRejectedDirection: 0, // TODO: track in matching engine
        pairsRejectedDetour: 0,    // TODO: track in matching engine
        durationMs: result.durationMs || 0,
        errorMessage: result.error || null,
      },
    });
  } catch (err) {
    console.warn(`⚠️  Failed to log matching cycle:`, err.message);
  }
}

/**
 * Run complete matching cycle with full transaction safety
 */
async function runMatchingCycle(triggerType = 'CRON') {
  const startTime = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      /**
       * 🔒 STEP 0: Count pending at start for logging
       */
      const pendingCountStart = await tx.rideRequest.count({
        where: { status: 'PENDING' },
      });

      /**
       * 🔒 STEP 1: Fetch pending requests with row-level lock
       * FOR UPDATE SKIP LOCKED ensures:
       * - Other concurrent transactions won't see these rows
       * - Multiple schedulers won't double-match
       */
      const pending = await fetchPendingRequests(tx);

      if (pending.length < 2) {
        console.log(`⏭️  Not enough pending requests (${pending.length})`);
        
        // ⚠️ CRITICAL: Still increment pending_cycles for unmatched requests
        if (pending.length > 0) {
          const matchedIds = new Set(); // No matches found
          const { cycleCancelled, timeCancelled } = await updatePendingCycles(tx, pending, matchedIds);
          const autoCancelledCount = cycleCancelled + timeCancelled;

          const usersStillPending = await tx.rideRequest.count({
            where: { status: 'PENDING' },
          });

          return {
            pendingCountStart,
            tripsCreated: 0,
            usersMatched: 0,
            usersStillPending,
            autoCancelledCount,  // ✅ Precise delta
            durationMs: Date.now() - startTime,
          };
        }

        const usersStillPending = await tx.rideRequest.count({
          where: { status: 'PENDING' },
        });

        return {
          pendingCountStart,
          tripsCreated: 0,
          usersMatched: 0,
          usersStillPending,
          autoCancelledCount: 0,
          durationMs: Date.now() - startTime,
        };
      }

      /**
       * ✅ STEP 2: Run matching engine (pure logic, no DB)
       */
      const matches = runMatchingBatch(pending);

      if (matches.length === 0) {
        console.log(`❌ No valid matches found for ${pending.length} requests`);
        
        // ⚠️ CRITICAL: Still increment pending_cycles for all unmatched requests
        const matchedIds = new Set(); // No matches found
        const { cycleCancelled, timeCancelled } = await updatePendingCycles(tx, pending, matchedIds);
        const autoCancelledCount = cycleCancelled + timeCancelled;

        const usersStillPending = await tx.rideRequest.count({
          where: { status: 'PENDING' },
        });

        return {
          pendingCountStart,
          tripsCreated: 0,
          usersMatched: 0,
          usersStillPending,
          autoCancelledCount,  // ✅ Precise delta
          durationMs: Date.now() - startTime,
        };
      }

      /**
       * ✅ STEP 3: Create trips from matches (within transaction)
       * 
       * PHASE 1 FIX: Pre-validate each match before attempting trip creation
       * This prevents logical errors from causing batch-wide transaction failures.
       * 
       * Process:
       * 1. Validate: all users in match still PENDING
       * 2. If valid: create trip (expected to succeed)
       * 3. If invalid: skip match (continue with next)
       * 4. If trip creation throws despite validation: real system error, let propagate
       */
      const validMatches = [];
      const matchedIds = new Set();

      for (const match of matches) {
        // 🔒 PRE-VALIDATION: Ensure all users in this match are still PENDING
        // This catches cases where a user cancelled between matching and trip creation
        const matchUserIds = match.users.map(u => u.rideRequestId);
        const stillPendingCount = await tx.rideRequest.count({
          where: {
            id: { in: matchUserIds },
            status: 'PENDING'
          }
        });

        if (stillPendingCount !== match.users.length) {
          const skipped = match.users.length - stillPendingCount;
          console.log(
            `⏭️  Skipping match: ${skipped}/${match.users.length} users no longer PENDING ` +
            `(likely cancelled during batch)`
          );
          continue;  // Skip this match, move to next
        }

        validMatches.push(match);
        match.users.forEach(u => matchedIds.add(u.rideRequestId));

        console.log(
          `✅ Match validated for trip creation: ${match.users.length} users, ${match.route.totalDistance.toFixed(2)}km`
        );
      }

      /**
       * ✅ STEP 4: Update pending_cycles for unmatched requests + track cancellations
       */
      const { cycleCancelled, timeCancelled } = await updatePendingCycles(tx, pending, matchedIds);
      const autoCancelledCount = cycleCancelled + timeCancelled;

      // Count remaining pending
      const usersStillPending = await tx.rideRequest.count({
        where: { status: 'PENDING' },
      });

      return {
        pendingCountStart,
        validMatches,
        usersStillPending,
        autoCancelledCount,
        durationMs: Date.now() - startTime,
      };
    });

    let tripsCreated = 0;
    let usersMatched = 0;

    for (const match of result.validMatches || []) {
      try {
        const trip = await createTripFromMatch(match);
        tripsCreated += 1;
        usersMatched += match.users.length;

        console.log(
          `✅ Trip created: ${trip.id} (${match.users.length} users, ${match.route.totalDistance.toFixed(2)}km)`
        );
      } catch (err) {
        if (err.message === 'ROAD_DETOUR_EXCEEDED' || err.message === 'Some ride requests already processed') {
          console.warn(`⏭️ Skipping trip creation for match: ${err.message}`);
          continue;
        }
        throw err;
      }
    }

    const usersStillPending = await prisma.rideRequest.count({
      where: { status: 'PENDING' },
    });

    const resultToLog = {
      pendingCountStart: result.pendingCountStart,
      tripsCreated,
      usersMatched,
      usersStillPending,
      autoCancelledCount: result.autoCancelledCount,
      durationMs: Date.now() - startTime,
    };

    // Log to database
    await logMatchingCycle(resultToLog, triggerType);

    return resultToLog;
  } catch (err) {
    console.error(`❌ Matching cycle failed:`, err);
    const result = {
      pendingCountStart: 0,
      tripsCreated: 0,
      usersMatched: 0,
      usersStillPending: 0,
      autoCancelledCount: 0,
      durationMs: Date.now() - startTime,
      error: err.message,
    };
    
    // Log error to database
    await logMatchingCycle(result, triggerType);

    return result;
  }
}

module.exports = {
  runMatchingCycle,
  logMatchingCycle,
};
