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

/**
 * POST /api/trips/:id/complete
 * Mark a trip as completed. Requesting user must be a participant.
 */
exports.completeTrip = async (req, res) => {
	try {
		const userId = req.headers['x-user-id'];
		const { id } = req.params;
		if (!userId) {
			return error(res, 'Missing x-user-id header', 400);
		}
		if (!id) {
			return error(res, 'Missing trip id', 400);
		}

		const result = await prisma.$transaction(async (tx) => {
			const trip = await tx.trip.findUnique({
				where: { id },
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
				return { already: true, trip };
			}

			const now = new Date();
			const updated = await tx.trip.update({
				where: { id },
				data: { status: 'COMPLETED', completedAt: now },
			});

			const rideRequestIds = trip.tripUsers.map((tu) => tu.rideRequestId).filter(Boolean);
			if (rideRequestIds.length > 0) {
				await tx.rideRequest.updateMany({
					where: { id: { in: rideRequestIds }, status: 'MATCHED' },
					data: { status: 'COMPLETED' },
				});
			}

			return { already: false, trip: updated };
		});

		if (result.already) {
			return success(res, { id: result.trip.id, status: 'COMPLETED', note: 'Already completed' });
		}

		return success(res, { id: result.trip.id, status: 'COMPLETED', completed_at: result.trip.completedAt });
	} catch (err) {
		console.error('Complete trip error:', err);
		if (err && err.code) {
			return error(res, err.message, err.code);
		}
		return error(res, err.message || 'Failed to complete trip', 500);
	}
};

