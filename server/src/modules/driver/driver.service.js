const prisma = require('../../prisma/client');

exports.getAvailableTrips = async () => {
  return await prisma.trip.findMany({
    where: { status: 'RIDERS_MATCHED' },
    include: {
      tripStops: {
        orderBy: { stopOrder: 'asc' },
        include: {
          rideRequest: {
            select: {
              pickupAddress: true,
              dropAddress: true,
            }
          }
        }
      },
      tripUsers: {
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            }
          }
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

exports.acceptTrip = async (userId, tripId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Get driver profile
    const driverProfile = await tx.driverProfile.findUnique({
      where: { userId },
    });
    if (!driverProfile) {
      throw { code: 404, message: 'Driver profile not found' };
    }

    // 2. Check if driver is already on an active trip
    const activeDriverTrip = await tx.driverTrip.findFirst({
      where: {
        driverProfileId: driverProfile.id,
        status: { in: ['ACCEPTED', 'STARTED'] },
      },
    });
    if (activeDriverTrip) {
      throw { code: 400, message: 'Driver is already on an active trip' };
    }

    // 3. Check trip status
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw { code: 404, message: 'Trip not found' };
    if (trip.status !== 'RIDERS_MATCHED') {
      throw { code: 400, message: 'Trip is no longer available' };
    }

    // 4. Create DriverTrip and update Trip status
    const driverTrip = await tx.driverTrip.create({
      data: {
        driverProfileId: driverProfile.id,
        tripId,
        status: 'ACCEPTED',
      },
    });

    await tx.trip.update({
      where: { id: tripId },
      data: { status: 'DRIVER_MATCHED' },
    });

    return driverTrip;
  });
};

exports.startTrip = async (userId, tripId) => {
  return await prisma.$transaction(async (tx) => {
    const driverProfile = await tx.driverProfile.findUnique({
      where: { userId },
    });
    if (!driverProfile) throw { code: 404, message: 'Driver profile not found' };

    const driverTrip = await tx.driverTrip.findUnique({
      where: { tripId },
    });
    if (!driverTrip || driverTrip.driverProfileId !== driverProfile.id) {
      throw { code: 403, message: 'Not authorized for this trip' };
    }
    if (driverTrip.status !== 'ACCEPTED') {
      throw { code: 400, message: 'Can only start an ACCEPTED trip' };
    }

    const updatedDriverTrip = await tx.driverTrip.update({
      where: { id: driverTrip.id },
      data: { status: 'STARTED', startedAt: new Date() },
    });

    await tx.trip.update({
      where: { id: tripId },
      data: { status: 'STARTED' },
    });

    return updatedDriverTrip;
  });
};

exports.completeTrip = async (userId, tripId) => {
  return await prisma.$transaction(async (tx) => {
    const driverProfile = await tx.driverProfile.findUnique({
      where: { userId },
    });
    if (!driverProfile) throw { code: 404, message: 'Driver profile not found' };

    const driverTrip = await tx.driverTrip.findUnique({
      where: { tripId },
    });
    if (!driverTrip || driverTrip.driverProfileId !== driverProfile.id) {
      throw { code: 403, message: 'Not authorized for this trip' };
    }
    if (driverTrip.status !== 'STARTED') {
      throw { code: 400, message: 'Can only complete a STARTED trip' };
    }

    const now = new Date();

    const updatedDriverTrip = await tx.driverTrip.update({
      where: { id: driverTrip.id },
      data: { status: 'COMPLETED', completedAt: now },
    });

    const trip = await tx.trip.update({
      where: { id: tripId },
      data: { status: 'COMPLETED', completedAt: now },
      include: { tripUsers: true },
    });

    await tx.rideRequest.updateMany({
      where: {
        id: { in: trip.tripUsers.map((tu) => tu.rideRequestId) },
      },
      data: {
        status: 'COMPLETED',
      },
    });

    return updatedDriverTrip;
  });
};

exports.getCurrentTrip = async (userId) => {
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { userId },
  });
  if (!driverProfile) return null;

  return await prisma.trip.findFirst({
    where: {
      status: { in: ['DRIVER_MATCHED', 'STARTED'] },
      driverTrip: {
        driverProfileId: driverProfile.id,
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
        orderBy: { stopOrder: 'asc' }
      },
      driverTrip: true,
    },
  });
};
