const express = require('express');
const router = express.Router();
const controller = require('./trip.controller');

// GET /api/trips - return trips visible to the requesting user
router.get('/', controller.getTrips);
router.get('/current', controller.getCurrent);

// GET /api/trips/:id - return a single trip by id
router.get('/:id', controller.getTripById);



module.exports = router;

