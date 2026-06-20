const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../prisma/client');

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

        const roomName = `trip_${tripId}`;
        socket.join(roomName);
        console.log(`🚪 User ${socket.userId} joined room ${roomName}`);
        
        socket.emit('tripJoined', { tripId });
      } catch (err) {
        console.error('joinTrip error:', err);
        socket.emit('error', { message: 'Failed to join trip room' });
      }
    });

    // Driver sends location update
    socket.on('driverLocationUpdate', async (data) => {
      const { tripId, lat, lng, bearing } = data;
      
      if (!tripId || lat === undefined || lng === undefined) return;

      // In a production app, we would cache the validation to avoid DB hits on every location ping.
      // For this demo, we'll assume the driver is valid if they are connected and emitting.
      
      const roomName = `trip_${tripId}`;
      
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(roomName).emit('driverLocation', {
        lat,
        lng,
        bearing,
        timestamp: Date.now()
      });
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
