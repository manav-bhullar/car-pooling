const prisma = require('../../prisma/client');
const { success, error } = require('../../utils/response');

/**
 * GET /api/trips
 * Returns trips relevant to the requesting user (via `x-user-id` header).
 * Response: array of trips with `fare_share` set to the current user's fare.
 */
exports.getTrips = async (req, res) => {
	try {
		const userId = req.headers['x-user-id'];
		if (!userId) {
			return error(res, 'Missing x-user-id header', 400);
		}

		const trips = await prisma.trip.findMany({
			where: {
				tripUsers: {
					some: { userId },
				},
			},
			include: {
				tripUsers: true,
				tripStops: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		const payload = trips.map((trip) => {
			const myTripUser = trip.tripUsers.find((tu) => tu.userId === userId);
			const fareShare = myTripUser ? Math.round((myTripUser.fareShare + Number.EPSILON) * 100) / 100 : null;

			const passengers = trip.tripUsers.map((tu) => ({
				userId: tu.userId,
				rideRequestId: tu.rideRequestId,
				fareShare: Math.round((tu.fareShare + Number.EPSILON) * 100) / 100,
			}));

			const stops = (trip.tripStops || [])
				.slice()
				.sort((a, b) => a.stopOrder - b.stopOrder)
				.map((s) => ({
					stopOrder: s.stopOrder,
					type: s.type,
					lat: s.lat,
					lng: s.lng,
					rideRequestId: s.rideRequestId,
					segmentDistKm: s.segmentDistKm,
					activePassengersOnSegment: s.activePassengersOnSegment,
				}));

			return {
				id: trip.id,
				status: trip.status,
				total_distance_km: trip.totalDistanceKm,
				estimated_eta_minutes: trip.estimatedEtaMinutes,
				detour_ratio: trip.detourRatio,
				fare_share: fareShare,
				passengers,
				stops,
				created_at: trip.createdAt,
				completed_at: trip.completedAt || null,
			};
		});

		return success(res, payload);
	} catch (err) {
		console.error('Get trips error:', err);
		return error(res, err.message || 'Failed to fetch trips', 500);
	}
};

