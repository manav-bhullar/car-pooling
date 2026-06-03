const prisma = require('../../prisma/client');

exports.createRideRequest = async(userId, data) => {
    const existing = await prisma.rideRequest.findFirst({
        where:{
            userId,
            status: "PENDING",
        },
    });

    if(existing){
        throw new Error("User already has a pending ride request");
    }

    const rideRequest = await prisma.rideRequest.create({
        data: {
            userId,
            pickupLat : data.pickupLat,
            pickupLng : data.pickupLng,
            dropLat : data.dropLat,
            dropLng : data.dropLng,
            pickupAddress: data.pickupAddress ?? null,
            dropAddress: data.dropAddress ?? null,
            preferredTime : new Date(data.preferredTime),
        },
    });
    return rideRequest;
}

exports.getRideRequests = async(userId, status) => {
    const requests = await prisma.rideRequest.findMany({
        where:{
            userId,
            ...(status && {status}),
        },
        orderBy:{
            createdAt: 'desc',
        },
    });

    // ✅ Phase 1: Enrich PENDING requests with requeue metadata
    // Detect: PENDING + TripUser exists + trip.status='CANCELLED' → requeued from cascade
    if (requests.length === 0) {
        return [];
    }

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const tripUsers = pendingRequests.length > 0
        ? await prisma.tripUser.findMany({
            where: { rideRequestId: { in: pendingRequests.map(r => r.id) } },
            include: { trip: { select: { id: true, status: true } } }
        })
        : [];

    const tripUserMap = Object.fromEntries(
        tripUsers.map(tu => [tu.rideRequestId, tu])
    );

    return requests.map(r => {
        if (r.status === 'PENDING') {
            const tripUser = tripUserMap[r.id];
            const requeued = tripUser?.trip?.status === 'CANCELLED';
            return {
                ...r,
                requeued,
                requeueReason: requeued ? 'CO_RIDER_CANCELLED' : null
            };
        }
        // Non-PENDING requests should still be returned with consistent schema
        return {
            ...r,
            requeued: false,
            requeueReason: null
        };
    });
};

exports.getCurrentRideRequest = async (userId) => {
    const matchedRequest = await prisma.rideRequest.findFirst({
        where: {
            userId,
            status: 'MATCHED',
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (matchedRequest) {
        return {
            ...matchedRequest,
            requeued: false,
            requeueReason: null,
        };
    }

    const pendingRequest = await prisma.rideRequest.findFirst({
        where: {
            userId,
            status: 'PENDING',
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (!pendingRequest) {
        return null;
    }

    const tripUser = await prisma.tripUser.findFirst({
        where: { rideRequestId: pendingRequest.id },
        include: { trip: { select: { status: true } } },
    });

    const requeued = tripUser?.trip?.status === 'CANCELLED';
    return {
        ...pendingRequest,
        requeued,
        requeueReason: requeued ? 'CO_RIDER_CANCELLED' : null,
    };
};

exports.cancelRideRequest = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.rideRequest.findUnique({
      where: { id },
    });
    if (!request) throw new Error("Ride request not found");
    if (request.userId !== userId) {
      throw new Error("Unauthorized");
    }
    if (request.status === "CANCELLED") {
      // Already cancelled → idempotent success
      // Try to find associated trip if it exists
      const tripUser = await tx.tripUser.findUnique({
        where: { rideRequestId: id },
      });
      return {
        id,
        status: "CANCELLED",
        cancelledTripId: tripUser?.tripId || null,
        note: "Already cancelled",
      };
    }
    // 🔹 CASE 1: PENDING → simple cancel
    if (request.status === "PENDING") {
      await tx.rideRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      await tx.tripUser.deleteMany({
        where: { rideRequestId: id },
      });

      return {
        id,
        status: "CANCELLED",
        cancelledTripId: null,
      };
    }
    // 🔹 CASE 2: MATCHED → CASCADE CANCEL
    // PHASE 2 FIX: Explicit state machine instead of count-based assumptions
    if (request.status === "MATCHED") {
      // 1. Find trip association
      const tripUser = await tx.tripUser.findUnique({
        where: { rideRequestId: id },
      });
      if (!tripUser) {
        throw new Error("Trip association not found");
      }
      const tripId = tripUser.tripId;
      
      // 2. PHASE 2 FIX: Fetch trip to inspect actual status (not guess from updateMany count)
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
      });
      if (!trip) {
        throw new Error("Trip not found");
      }

      // 3. Branch by trip status (explicit state machine)
      if (trip.status === 'COMPLETED') {
        // ❌ CRITICAL: Cannot cascade cancel a completed trip
        // Rider should not be MATCHED on a completed trip; this is an invalid state
        throw new Error("TRIP_ALREADY_COMPLETED: Cannot cancel request on completed trip");
      }

      if (trip.status === 'CANCELLED') {
        // ✅ Idempotent: Trip already cancelled, co-riders already reverted
        // Just return success
        return {
          id,
          status: "CANCELLED",
          cancelledTripId: tripId,
          note: "Trip already cancelled",
        };
      }

      if (trip.status === 'ACTIVE') {
        // ✅ Only ACTIVE trips can be cascaded
        // 4. Cancel the trip
        const updated = await tx.trip.update({
          where: { id: tripId },
          data: { status: "CANCELLED" },
        });

        // 5. Get all ride requests in this trip
        const tripUsers = await tx.tripUser.findMany({
          where: { tripId },
        });
        const rideRequestIds = tripUsers.map(tu => tu.rideRequestId);
        const coRiderIds = rideRequestIds.filter(rid => rid !== id);

        // 6. Cancel the triggering user
        await tx.rideRequest.update({
          where: { id },
          data: { status: "CANCELLED" },
        });

        // 7. Revert co-riders to PENDING and remove their TripUser linkage
        if (coRiderIds.length > 0) {
          await tx.rideRequest.updateMany({
            where: {
              id: { in: coRiderIds },
              status: "MATCHED",
            },
            data: {
              status: "PENDING",
            },
          });

          await tx.tripUser.deleteMany({
            where: {
              tripId,
              rideRequestId: { in: coRiderIds },
            },
          });
        }

        return {
          id,
          status: "CANCELLED",
          cancelledTripId: tripId,
        };
      }

      // Should never reach here
      throw new Error(`Unexpected trip status: ${trip.status}`);
    }
    throw new Error("Invalid state");
  });
}