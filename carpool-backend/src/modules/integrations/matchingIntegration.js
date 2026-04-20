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
 */
async function updatePendingCycles(tx, allRequests, matchedIds) {
  const unmatchedIds = allRequests
    .map(r => r.id)
    .filter(id => !matchedIds.has(id));

  if (unmatchedIds.length === 0) return;

  // 🔒 Increment pending cycles for unmatched PENDING requests ONLY
  // Prevents dirty updates if a request somehow becomes MATCHED/CANCELLED
  await tx.rideRequest.updateMany({
    where: {
      id: { in: unmatchedIds },
      status: 'PENDING'  // ✅ CRITICAL: Only update PENDING requests
    },
    data: {
      pendingCycles: { increment: 1 }
    }
  });

  // 🔒 Auto-cancel PENDING requests that have been pending for 5+ cycles
  // Double-check status to prevent accidentally cancelling MATCHED requests
  await tx.rideRequest.updateMany({
    where: {
      id: { in: unmatchedIds },
      status: 'PENDING',  // ✅ CRITICAL: Only cancel PENDING requests
      pendingCycles: { gte: 5 }
    },
    data: {
      status: 'CANCELLED'
    }
  });
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
          // Track cancellations with delta approach
          const cancelledBefore = await tx.rideRequest.count({
            where: {
              id: { in: pending.map(r => r.id) },
              status: 'CANCELLED'
            },
          });

          const matchedIds = new Set(); // No matches found
          await updatePendingCycles(tx, pending, matchedIds);

          const cancelledAfter = await tx.rideRequest.count({
            where: {
              id: { in: pending.map(r => r.id) },
              status: 'CANCELLED'
            },
          });

          const autoCancelledCount = cancelledAfter - cancelledBefore;

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
        // Track cancellations with delta approach
        const cancelledBefore = await tx.rideRequest.count({
          where: {
            id: { in: pending.map(r => r.id) },
            status: 'CANCELLED'
          },
        });

        const matchedIds = new Set(); // No matches found
        await updatePendingCycles(tx, pending, matchedIds);

        const cancelledAfter = await tx.rideRequest.count({
          where: {
            id: { in: pending.map(r => r.id) },
            status: 'CANCELLED'
          },
        });

        const autoCancelledCount = cancelledAfter - cancelledBefore;

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
       */
      const createdTrips = [];
      const matchedIds = new Set();
      let usersMatched = 0;

      for (const match of matches) {
        try {
          const trip = await createTripFromMatch(match, tx);
          createdTrips.push(trip);
          usersMatched += match.users.length;

          // Track matched IDs for pending_cycles update
          match.users.forEach(u => matchedIds.add(u.rideRequestId));

          console.log(
            `✅ Trip created: ${trip.id} (${match.users.length} users, ${match.route.totalDistance.toFixed(2)}km)`
          );
        } catch (err) {
          console.error(`❌ Failed to create trip:`, err.message);
        }
      }

      /**
       * ✅ STEP 4: Update pending_cycles for unmatched requests + track cancellations
       */
      const unmatched = pending.filter(r => !matchedIds.has(r.id));

      // 🔒 CRITICAL: Count BEFORE to measure delta
      // This ensures we only count what was cancelled IN THIS CYCLE
      const cancelledBefore = await tx.rideRequest.count({
        where: {
          id: { in: unmatched.map(u => u.id) },
          status: 'CANCELLED'
        },
      });

      // Apply update
      await updatePendingCycles(tx, pending, matchedIds);

      // Count AFTER to measure delta
      const cancelledAfter = await tx.rideRequest.count({
        where: {
          id: { in: unmatched.map(u => u.id) },
          status: 'CANCELLED'
        },
      });

      // Precise: only count requests cancelled in THIS cycle
      const autoCancelledCount = cancelledAfter - cancelledBefore;

      // Count remaining pending
      const usersStillPending = await tx.rideRequest.count({
        where: { status: 'PENDING' },
      });

      return {
        pendingCountStart,
        tripsCreated: createdTrips.length,
        usersMatched,
        usersStillPending,
        autoCancelledCount,
        durationMs: Date.now() - startTime,
      };
    });

    // Log to database
    await logMatchingCycle(result, triggerType);

    return result;
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
