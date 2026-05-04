// ✅ FIX THIS
const prisma = require("../../prisma/client");
const { buildTripStops } = require("./trip.utils");
const { calculateFares } = require("./trip.fare");

/**
 * Create Trip from matching result
 * STRICT version (safe + aligned with schema)
 * @param {Object} match - Match object with users, route, detourRatio
 * @param {Object} tx - Optional transaction client. If provided, uses it; otherwise creates new transaction
 */
async function createTripFromMatch(match, tx = null) {
  const { users, route, detourRatio } = match;
  // Validation: ensure orderedIndices contract satisfied
  if (!route || !route.orderedIndices) {
    throw new Error('Invalid match: route.orderedIndices missing');
  }

  if (route.orderedIndices.length !== users.length * 2) {
    throw new Error(`Invalid match: orderedIndices.length=${route.orderedIndices.length} expected=${users.length * 2}`);
  }

  if (!users || users.length < 2) {
    throw new Error("Invalid match: not enough users");
  }

  if (!route || !route.orderedIndices || route.orderedIndices.length === 0) {
    throw new Error("Invalid match: route missing orderedIndices");
  }

  // Extract rideRequestIds properly
  const rideRequestIds = users.map((u) => u.rideRequestId);

  // Use provided transaction or create new one
  const executor = tx || prisma;
  const isNestedTransaction = !!tx;

  const executeTransaction = async (txContext) => {
    /**
     * 🔒 STEP 0 — SAFETY CHECK
     * Ensure all requests are still PENDING
     */
    const validRequests = await txContext.rideRequest.findMany({
      where: {
        id: { in: rideRequestIds },
        status: "PENDING",
      },
      select: { id: true },
    });

    if (validRequests.length !== rideRequestIds.length) {
      throw new Error("Some ride requests already processed");
    }

    /**
     * ✅ STEP 1 — CREATE TRIP
     */
    const trip = await txContext.trip.create({
      data: {
        status: "ACTIVE",
        totalDistanceKm: route.totalDistance,
        estimatedEtaMinutes: Math.round(
          (route.totalDistance / 30) * 60 // correct ETA formula
        ),
        detourRatio: detourRatio,
      },
    });

    /**
     * ✅ STEP 2 — BUILD STOPS (in-memory, deterministic)
     */
    const stopsData = buildTripStops(users, route.orderedIndices).map((stop) => ({
      tripId: trip.id,
      ...stop,
    }));

    /**
     * ✅ STEP 3 — CALCULATE FARES (pure computation using stored stop rows)
     * Must run inside the transaction so persistence is atomic.
     */
    const fares = calculateFares(users, stopsData);

    /**
     * ✅ STEP 4 — CREATE TRIP USERS (persist fares atomically)
     */
    const tripUsersData = users.map((user) => ({
      tripId: trip.id,
      userId: user.userId,
      rideRequestId: user.rideRequestId,
      fareShare: fares[user.rideRequestId],
    }));

    await txContext.tripUser.createMany({ data: tripUsersData });

    /**
     * ✅ STEP 5 — PERSIST TRIP STOPS
     */
    await txContext.tripStop.createMany({ data: stopsData });

    /**
     * ✅ STEP 4 — UPDATE RIDE REQUESTS
     */
    await txContext.rideRequest.updateMany({
      where: {
        id: { in: rideRequestIds },
        status: "PENDING", // extra safety
      },
      data: {
        status: "MATCHED",
        pendingCycles: 0,
      },
    });

    return trip;
  };

  // If nested, just execute within the transaction context
  if (isNestedTransaction) {
    return await executeTransaction(tx);
  }

  // Otherwise, create a new transaction
  return await executor.$transaction(executeTransaction);
}

async function getTripById(tripId, userId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      tripUsers: {
        include: { user: true },
      },
      tripStops: true,
    },
  });

  if (!trip) {
    return null;
  }

  const isParticipant = trip.tripUsers.some((tu) => tu.userId === userId);
  if (!isParticipant) {
    throw { code: 403, message: 'Forbidden' };
  }

  return trip;
}

async function completeTrip(tripId, userId) {
  return await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { tripUsers: true },
    });

    if (!trip) {
      throw { code: 404, message: 'Trip not found' };
    }

    const isParticipant = trip.tripUsers.some((tu) => tu.userId === userId);
    if (!isParticipant) {
      throw { code: 403, message: 'Not a trip participant' };
    }

    if (trip.status === 'COMPLETED') {
      return {
        id: trip.id,
        status: 'COMPLETED',
        completedAt: trip.completedAt,
      };
    }

    if (trip.status === 'CANCELLED') {
      throw { code: 400, message: 'TRIP_NOT_COMPLETABLE' };
    }

    if (trip.status !== 'ACTIVE') {
      throw { code: 400, message: 'TRIP_NOT_COMPLETABLE' };
    }

    const now = new Date();

    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
      },
    });

    return {
      id: updatedTrip.id,
      status: 'COMPLETED',
      completedAt: updatedTrip.completedAt,
    };
  });
}

module.exports = {
  createTripFromMatch,
  getTripById,
  completeTrip,
};