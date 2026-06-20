const express = require('express');
const driverController = require('./driver.controller');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');

const router = express.Router();

// All routes here require authentication and DRIVER role
router.use(authenticate);
router.use(requireRole(['DRIVER']));

router.get('/trips/available', driverController.getAvailableTrips);
router.get('/trips/current', driverController.getCurrentTrip);
router.post('/trips/:tripId/accept', driverController.acceptTrip);
router.post('/trips/:tripId/start', driverController.startTrip);
router.post('/trips/:tripId/complete', driverController.completeTrip);

module.exports = router;
