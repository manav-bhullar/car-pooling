const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rideRequestRoutes = require('./modules/rideRequest/rideRequest.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const tripRoutes = require('./modules/trip/trip.routes');
const authRoutes = require('./modules/auth/auth.routes');
const driverRoutes = require('./modules/driver/driver.routes');
const { authenticate } = require('./middleware/auth.middleware');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, /^http:\/\/localhost:\d+$/]
  : [/^http:\/\/localhost:\d+$/];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.use('/api/ride-requests', authenticate, rideRequestRoutes);
app.use('/api/admin', authenticate, adminRoutes);
app.use('/api/trips', authenticate, tripRoutes);
app.use('/api/driver', driverRoutes); // auth is handled inside driverRoutes

module.exports = app;