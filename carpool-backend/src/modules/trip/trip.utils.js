function buildTripStops(users, orderedIndices) {
    const n = users.length;

    const coords = [
        ...users.map(u => [u.pickupLat, u.pickupLng]),
        ...users.map(u => [u.dropLat, u.dropLng]),
    ]
}