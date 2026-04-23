const express = require('express');
const router = express.Router();
const controller = require('./trip.controller');

// GET /api/trips - return trips visible to the requesting user
router.get('/', controller.getTrips);

module.exports = router;

