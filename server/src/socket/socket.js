const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../prisma/client');
const { getRedis } = require('../utils/redis');

// Key: driver:location:{tripId}  TTL: 60s (auto-clears if driver disconnects)
const DRIVER_LOCATION_KEY = (tripId) => `driver:location:${tripId}`;
const DRIVER_LOCATION_TTL = 60; // seconds

let io;

function initSocket(server) {
  const allowedOrigins = [
    /^http:\/\/localhost:\d+$/,        // All localhost ports (dev)
    /^https:\/\/.*\.vercel\.app$/,    // All Vercel preview + production URLs
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join a room for the user's specific ID to allow direct notifications
    socket.join(socket.userId);

    // Join a specific trip room
    socket.on('joinTrip', async ({ tripId }) => {
      try {
        // Validate user belongs to this trip (either passenger or driver)
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          include: {
            tripUsers: true,
            driverTrip: {
              include: { driverProfile: true },
            },
          },
        });

        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        const isPassenger = trip.tripUsers.some(tu => tu.userId === socket.userId);
        const isDriver = trip.driverTrip && trip.driverTrip.driverProfile.userId === socket.userId;

        if (!isPassenger && !isDriver) {
          socket.emit('error', { message: 'Unauthorized for this trip' });
          return;
        }

        if (isDriver) {
          socket.isDriverForTrip = tripId;
        }

        const roomName = `trip_${tripId}`;
        socket.join(roomName);
        console.log(`🚪 User ${socket.userId} joined room ${roomName} as ${isDriver ? 'driver' : 'rider'}`);
        
        socket.emit('tripJoined', { tripId });

        // Replay last known driver location immediately to the joiner (riders only)
        // This gives an instant position pin without waiting for the next GPS tick
        if (!isDriver) {
          try {
            const cached = await getRedis().get(DRIVER_LOCATION_KEY(tripId));
            if (cached) {
              socket.emit('driverLocation', JSON.parse(cached));
            }
          } catch (_) {
            // Best-effort, don't block the join
          }
        }
      } catch (err) {
        console.error('joinTrip error:', err);
        socket.emit('error', { message: 'Failed to join trip room' });
      }
    });

    // Driver sends location update
    socket.on('driverLocationUpdate', async (data) => {
      const { tripId, lat, lng, bearing } = data;
      
      if (!tripId || lat === undefined || lng === undefined) return;

      // SECURITY FIX: Verify this socket is the authenticated driver for this trip
      if (socket.isDriverForTrip !== tripId) {
        console.warn(`⚠️ User ${socket.userId} attempted to spoof location for trip ${tripId}`);
        return;
      }
      
      const roomName = `trip_${tripId}`;
      const locationPayload = { lat, lng, bearing, timestamp: Date.now() };

      // Persist to Redis — survives brief socket disconnects & powers REST fallback
      try {
        await getRedis().set(
          DRIVER_LOCATION_KEY(tripId),
          JSON.stringify(locationPayload),
          'EX',
          DRIVER_LOCATION_TTL
        );
      } catch (_) {
        // Best-effort, don't block the broadcast
      }

      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(roomName).emit('driverLocation', locationPayload);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = {
  initSocket,
  getIo,
};
