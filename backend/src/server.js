/**
 * server.js — Application entry point.
 *
 * Boot order:
 *   1. Load .env
 *   2. Create HTTP server
 *   3. Attach Socket.IO
 *   4. Start listening on PORT  (health endpoint available immediately)
 *   5. Attempt MongoDB connection in background — server stays up even
 *      if Atlas URI is missing (useful for local development)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const http           = require('http');
const app            = require('./app');
const { initSocket } = require('./socket');
const connectDB      = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const ENV  = process.env.NODE_ENV || 'development';

// ─── HTTP server (shared by Express + Socket.IO) ─────────────────────────────
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
initSocket(server);

// ─── Start listening ─────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log(`│   AI Smart Resale Inspector — Backend Server     │`);
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│   URL  : http://localhost:${PORT}                    │`);
  console.log(`│   MODE : ${ENV.padEnd(39)}│`);
  console.log('└─────────────────────────────────────────────────┘');
  console.log('');
});

// ─── MongoDB (non-blocking) ───────────────────────────────────────────────────
connectDB()
  .then(() => console.log('[server] MongoDB ready'))
  .catch((err) => {
    console.warn('[server] MongoDB unavailable —', err.message);
    console.warn('[server] Set MONGODB_URI in backend/.env to enable persistence.');
  });

// ─── Safety nets ─────────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM — shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT — shutting down gracefully');
  server.close(() => process.exit(0));
});
