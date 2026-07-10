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

const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,        // All localhost ports (dev)
  /^https:\/\/.*\.vercel\.app$/,    // All Vercel preview + production URLs
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.use('/api/ride-requests', authenticate, rideRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', authenticate, tripRoutes);
app.use('/api/driver', driverRoutes); // auth is handled inside driverRoutes

module.exports = app;