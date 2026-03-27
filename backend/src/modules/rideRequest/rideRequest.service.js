import prisma from '../../config/db.js';

export const createRideRequest = async (data) => {
  const {
    userId,
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
    preferredTime
  } = data;

  // ❌ 1. pickup == drop
  if (pickupLat === dropLat && pickupLng === dropLng) {
    throw new Error('Pickup and drop cannot be same');
  }

  // ❌ 2. preferred_time validation
  const now = new Date();
  const prefTime = new Date(preferredTime);

  const diffMinutes = (now - prefTime) / (1000 * 60);

  if (diffMinutes > 5) {
    throw new Error('Preferred time cannot be more than 5 minutes in past');
  }

  // ❌ 3. duplicate pending request
  const existing = await prisma.rideRequest.findFirst({
    where: {
      userId,
      status: 'PENDING'
    }
  });

  if (existing) {
    throw new Error('User already has a pending request');
  }

  // ✅ 4. create request
  const rideRequest = await prisma.rideRequest.create({
    data: {
      userId,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      preferredTime: prefTime
    }
  });

  return rideRequest;
};