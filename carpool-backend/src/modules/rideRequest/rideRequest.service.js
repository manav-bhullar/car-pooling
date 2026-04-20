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
    return prisma.rideRequest.findMany({
        where:{
            userId,
            ...(status && {status}),
        },
        orderBy:{
            createdAt: 'desc',
        },
    });
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
      return request;
    }
    // 🔹 CASE 1: PENDING → simple cancel
    if (request.status === "PENDING") {
      return tx.rideRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    }
    // 🔹 CASE 2: MATCHED → CASCADE CANCEL
    if (request.status === "MATCHED") {
      // 1. Find trip via TripUser
      const tripUser = await tx.tripUser.findUnique({
        where: { rideRequestId: id },
      });
      if (!tripUser) {
        throw new Error("Trip association not found");
      }
      const tripId = tripUser.tripId;
      // 2. Cancel trip
      await tx.trip.update({
        where: { id: tripId },
        data: { status: "CANCELLED" },
      });
      // 3. Get all ride requests in this trip
      const tripUsers = await tx.tripUser.findMany({
        where: { tripId },
      });
      const rideRequestIds = tripUsers.map(tu => tu.rideRequestId);
      // 4. Update all ride requests
      for (const rid of rideRequestIds) {
        if (rid === id) {
          // Cancelling user
          await tx.rideRequest.update({
            where: { id: rid },
            data: { status: "CANCELLED" },
          });
        } else {
          // Co-riders → back to PENDING
          await tx.rideRequest.update({
            where: { id: rid },
            data: { status: "PENDING" },
          });
        }
      }
      return {
        id,
        status: "CANCELLED",
        cancelledTripId: tripId,
      };
    }
    throw new Error("Invalid state");
  });
}