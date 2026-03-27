const express = require('express');
const rideRequestRoutes = require('./modules/rideRequest/rideRequest.routes');

const app = express();

app.use(express.json());

app.use('/api/ride-requests', rideRequestRoutes);

module.exports = app;