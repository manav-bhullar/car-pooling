const prisma = require('../../prisma/client');
const service = require('./trip.service');
const { success, error } = require('../../utils/response');

function serializeTrip(trip, userId) {
	const myTripUser = trip.tripUsers.find((tu) => tu.userId === userId);
	const fareShare = myTripUser ? Math.round((myTripUser.fareShare + Number.EPSILON) * 100) / 100 : null;

	const passengers = trip.tripUsers.map((tu) => ({
		userId: tu.userId,
		name: tu.user.name,
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
		totalDistanceKm: trip.totalDistanceKm,
		estimatedEtaMinutes: trip.estimatedEtaMinutes,
		detourRatio: trip.detourRatio,
		fareShare,
		passengers,
		stops,
		createdAt: trip.createdAt,
		completedAt: trip.completedAt || null,
	};
}

/**
 * GET /api/trips
 * Returns trips relevant to the requesting user (via `x-user-id` header).
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
				tripUsers: {
					include: { user: true },
				},
				tripStops: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		const payload = trips.map((trip) => serializeTrip(trip, userId));

		return success(res, payload);
	} catch (err) {
		console.error('Get trips error:', err);
		return error(res, err.message || 'Failed to fetch trips', 500);
	}
};

/**
 * POST /api/trips/:id/complete
 * Mark a trip as completed. Requesting user must be a participant.
 * 
 * PHASE 3 FIX: Lifecycle Synchronization
 * Trip completion now updates all associated ride requests to COMPLETED state.
 * This ensures trip.status and rideRequest.status are always consistent.
 */
exports.getTripById = async (req, res) => {
	try {
		const userId = req.headers['x-user-id'];
		const { id } = req.params;
		if (!userId) {
			return error(res, 'Missing x-user-id header', 400);
		}
		if (!id) {
			return error(res, 'Missing trip id', 400);
		}

		const trip = await service.getTripById(id, userId);
		if (!trip) {
			return error(res, 'Trip not found', 404);
		}

		const payload = serializeTrip(trip, userId);
		return success(res, payload);
	} catch (err) {
		console.error('Get trip by id error:', err);
		return error(res, err.message || 'Failed to fetch trip', 500);
	}
};

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

		const data = await service.completeTrip(id, userId);
		return success(res, data);
	} catch (err) {
		console.error('Complete trip error:', err);
		if (err && err.code) {
			return error(res, err.message, err.code);
		}
		return error(res, err.message || 'Failed to complete trip', 500);
	}
};

