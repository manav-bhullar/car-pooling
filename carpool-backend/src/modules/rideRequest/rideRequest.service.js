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
    if (requests.length > 0) {
        const pendingRequests = requests.filter(r => r.status === 'PENDING');
        
        if (pendingRequests.length > 0) {
            // 🔒 Batch-fetch TripUser + Trip relationships (no N+1)
            const tripUsers = await prisma.tripUser.findMany({
                where: { rideRequestId: { in: pendingRequests.map(r => r.id) } },
                include: { trip: { select: { id: true, status: true } } }
            });

            const tripUserMap = Object.fromEntries(
                tripUsers.map(tu => [tu.rideRequestId, tu])
            );

            // Map all requests: enrich PENDING with requeue info, others with defaults
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
                // Non-PENDING requests never requeued
                return {
                    ...r,
                    requeued: false,
                    requeueReason: null
                };
            });
        }
    }

    // No requests: return empty array with consistent schema
    return [];
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

        // 6. Cancel the triggering user
        await tx.rideRequest.update({
          where: { id },
          data: { status: "CANCELLED" },
        });

        // 7. Revert co-riders to PENDING (only if they're still MATCHED)
        if (rideRequestIds.length > 1) {
          await tx.rideRequest.updateMany({
            where: {
              id: { in: rideRequestIds.filter(rid => rid !== id) },
              status: "MATCHED",
            },
            data: {
              status: "PENDING",
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