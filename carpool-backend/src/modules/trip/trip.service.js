// ✅ FIX THIS
const prisma = require("../../prisma/client");
const { calculateFares } = require("./trip.fare");
const { getRoadDistances, ROAD_DETOUR_THRESHOLD } = require("./osrm");
const { haversine } = require("../matching/utils");

const AVG_SPEED_KMH = 30;

/**
 * Create Trip from matching result
 * STRICT version (safe + aligned with schema)
 * @param {Object} match - Match object with users, route, detourRatio
 * @param {Object} tx - Optional transaction client. If provided, uses it; otherwise creates new transaction
 */
async function createTripFromMatch(match, tx = null) {
  const { users, route, detourRatio } = match;

  if (!route || !route.orderedIndices) {
    throw new Error('Invalid match: route.orderedIndices missing');
  }

  if (route.orderedIndices.length !== users.length * 2) {
    throw new Error(`Invalid match: orderedIndices.length=${route.orderedIndices.length} expected=${users.length * 2}`);
  }

  if (!users || users.length < 2) {
    throw new Error('Invalid match: not enough users');
  }

  const rideRequestIds = users.map((u) => u.rideRequestId);
  const coords = [
    ...users.map((u) => ({ lat: u.pickupLat, lng: u.pickupLng })),
    ...users.map((u) => ({ lat: u.dropLat, lng: u.dropLng })),
  ];

  const orderedStops = route.orderedIndices.map((idx) => coords[idx]);
  const haversineTotal = route.totalDistance;

  // Always use OSRM (or its fallback logic inside getRoadDistances)
  const roadData = await getRoadDistances(orderedStops, users, haversineTotal);

  if (roadData.roadDetourRatio > ROAD_DETOUR_THRESHOLD) {
    console.warn(
      `[OSRM] Road detour too high: ${roadData.roadDetourRatio.toFixed(2)} > ${ROAD_DETOUR_THRESHOLD}. Rejecting match.`
    );
    throw new Error('ROAD_DETOUR_EXCEEDED');
  }

  const totalRoadDistanceKm = roadData.totalRoadDistanceKm;
  const estimatedEtaMinutes = Math.round((totalRoadDistanceKm / AVG_SPEED_KMH) * 60);

  const executor = tx || prisma;
  const isNestedTransaction = !!tx;

  const executeTransaction = async (txContext) => {
    const validRequests = await txContext.rideRequest.findMany({
      where: {
        id: { in: rideRequestIds },
        status: 'PENDING',
      },
      select: { id: true },
    });

    if (validRequests.length !== rideRequestIds.length) {
      throw new Error('Some ride requests already processed');
    }

    const trip = await txContext.trip.create({
      data: {
        status: 'ACTIVE',
        totalDistanceKm: totalRoadDistanceKm,
        estimatedEtaMinutes,
        detourRatio: roadData.roadDetourRatio,
      },
    });

    const stopsData = buildTripStopsWithRoadDistances(users, route.orderedIndices, roadData.legDistances).map((stop) => ({
      tripId: trip.id,
      ...stop,
    }));

    const fares = calculateFares(users, stopsData);

    await txContext.tripUser.createMany({
      data: users.map((user) => ({
        tripId: trip.id,
        userId: user.userId,
        rideRequestId: user.rideRequestId,
        fareShare: fares[user.rideRequestId],
      })),
    });

    await txContext.tripStop.createMany({ data: stopsData });

    await txContext.rideRequest.updateMany({
      where: {
        id: { in: rideRequestIds },
        status: 'PENDING',
      },
      data: {
        status: 'MATCHED',
        pendingCycles: 0,
      },
    });

    return trip;
  };

  if (isNestedTransaction) {
    return await executeTransaction(tx);
  }

  return await executor.$transaction(executeTransaction);
}

function buildTripStopsWithRoadDistances(users, orderedIndices, legDistances) {
  const n = users.length;
  const coords = [
    ...users.map((u) => ({ lat: u.pickupLat, lng: u.pickupLng })),
    ...users.map((u) => ({ lat: u.dropLat, lng: u.dropLng })),
  ];

  const active = new Set();
  const stops = [];

  for (let i = 0; i < orderedIndices.length; i++) {
    const idx = orderedIndices[i];
    const { lat, lng } = coords[idx];
    const segmentDistKm = i === 0 ? 0 : legDistances[i - 1];
    const activePassengers = active.size;

    let type;
    let rideRequestId;

    if (idx < n) {
      type = 'PICKUP';
      rideRequestId = users[idx].rideRequestId;
      active.add(idx);
    } else {
      type = 'DROPOFF';
      const userIdx = idx - n;
      rideRequestId = users[userIdx].rideRequestId;
      active.delete(userIdx);
    }

    stops.push({
      stopOrder: i,
      type,
      lat,
      lng,
      rideRequestId,
      segmentDistKm,
      activePassengersOnSegment: activePassengers,
    });
  }

  return stops;
}

async function getTripById(tripId, userId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      tripUsers: {
        include: { user: true },
      },
      tripStops: {
        include: {
          rideRequest: {
            select: {
              pickupAddress: true,
              dropAddress: true,
            },
          },
        },
      },
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

async function getCurrentTrip(userId) {
  const activeTrip = await prisma.trip.findFirst({
    where: {
      status: 'ACTIVE',
      tripUsers: {
        some: { userId },
      },
    },
    include: {
      tripUsers: {
        include: { user: true },
      },
      tripStops: {
        include: {
          rideRequest: {
            select: {
              pickupAddress: true,
              dropAddress: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (activeTrip) {
    return activeTrip;
  }

  return null;
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

    await tx.rideRequest.updateMany({
      where: {
        id: { in: trip.tripUsers.map((tu) => tu.rideRequestId) },
      },
      data: {
        status: 'COMPLETED',
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