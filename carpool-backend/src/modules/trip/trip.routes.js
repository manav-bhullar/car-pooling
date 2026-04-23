const express = require('express');
const router = express.Router();
const controller = require('./trip.controller');

// GET /api/trips - return trips visible to the requesting user
router.get('/', controller.getTrips);

// POST /api/trips/:id/complete - mark trip as completed
router.post('/:id/complete', controller.completeTrip);

module.exports = router;

