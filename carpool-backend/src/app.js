const express = require('express');
const rideRequestRoutes = require('./modules/rideRequest/rideRequest.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

app.use(express.json());

app.use('/api/ride-requests', rideRequestRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;