const express = require('express');
const router = express.Router();
const controller = require('./trip.controller');

// GET /api/trips
router.get('/', controller.getTrips);
// GET /api/trips/current
router.get('/current', controller.getCurrent);
// GET /api/trips/:id/driver-location — REST fallback for riders who lose socket
router.get('/:id/driver-location', controller.getDriverLocation);
// GET /api/trips/:id
router.get('/:id', controller.getTripById);

module.exports = router;
