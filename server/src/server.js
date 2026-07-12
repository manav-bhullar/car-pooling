require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket/socket');
const { connectRedis, disconnectRedis } = require('./utils/redis');

const PORT = process.env.PORT || 5050;

// Initialize Redis
connectRedis();

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const { startMatchingScheduler } = require("./modules/scheduler/matching.cron");
startMatchingScheduler();

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectRedis();
    console.log('Server closed.');
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));