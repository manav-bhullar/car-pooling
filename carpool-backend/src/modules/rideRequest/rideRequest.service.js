const prisma = require('../../prisma/prismaClient');

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

exports.cancelRideRequest = async(id, userId) => {
    const request = await prisma.rideRequest.findUnique({
        where: {id},
    });

    if(!request){
        throw new Error("Ride request not found");
    }

    if(request.userId !== userId){
        throw new Error("Unauthorized");
    }

    if(request.status === "CANCELLED"){
        return request;
    }

    if(request.status !== "PENDING"){
        throw new Error("Only pending requests can be cancelled");
    }

    return prisma.rideRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}