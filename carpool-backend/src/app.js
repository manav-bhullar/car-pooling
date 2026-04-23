const express = require('express');
const rideRequestRoutes = require('./modules/rideRequest/rideRequest.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const tripRoutes = require('./modules/trip/trip.routes');

const app = express();

app.use(express.json());

app.use('/api/ride-requests', rideRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);

module.exports = app;