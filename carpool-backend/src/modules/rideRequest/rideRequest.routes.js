const express = require('express');
const router = express.Router();
const controller = require('./rideRequest.controller');

router.post('/', controller.create);
router.get('/', controller.getAll);
router.post('/:id/cancel', controller.cancel);

module.exports = router;