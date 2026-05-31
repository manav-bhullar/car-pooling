exports.validateCreateRideRequest = (body) => {
  const {
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
    pickupAddress,
    dropAddress,
    preferredTime,
  } = body;

  if (
    pickupLat == null ||
    pickupLng == null ||
    dropLat == null ||
    dropLng == null ||
    !preferredTime
  ) {
    return "All fields are required";
  }

  if (pickupAddress != null && typeof pickupAddress !== 'string') {
    return "pickupAddress must be a string";
  }

  if (dropAddress != null && typeof dropAddress !== 'string') {
    return "dropAddress must be a string";
  }

  if (pickupLat === dropLat && pickupLng === dropLng) {
    return "Pickup and drop cannot be same";
  }

  const now = new Date();
  const prefTime = new Date(preferredTime);

  if (prefTime < new Date(now.getTime() - 5 * 60 * 1000)) {
    return "Preferred time cannot be in the past";
  }

  return null;
};