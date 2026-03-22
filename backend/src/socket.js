/**
 * socket.js — Socket.IO initialisation and event registration.
 *
 * Centralising Socket.IO here keeps server.js clean and
 * allows individual feature modules to emit events when needed.
 */

const { Server } = require('socket.io');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:  process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // ─── Inspection events will be registered in Part 4+ ──────────────────
    socket.on('inspection:start', (data) => {
      console.log(`[socket] inspection:start from ${socket.id}`, data);
      // Placeholder — real handler added in Part 5
    });

    socket.on('disconnect', () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/** Get the Socket.IO instance (after initSocket has been called). */
function getIO() {
  if (!io) throw new Error('Socket.IO has not been initialised');
  return io;
}

module.exports = { initSocket, getIO };
