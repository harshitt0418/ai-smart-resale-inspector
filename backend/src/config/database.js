/**
 * config/database.js — Mongoose connection manager.
 *
 * Supports:
 *   • MongoDB Atlas (production)  — set MONGODB_URI to an Atlas connection string
 *   • Local mongod (development)  — set MONGODB_URI to mongodb://localhost:27017/resale-inspector
 *   • No database (demo mode)     — leave MONGODB_URI empty; the server starts normally
 *                                    but any endpoint that touches Mongoose will return 503.
 */

const mongoose = require('mongoose');

/** Track connection state so controllers can check before querying. */
let _connected = false;

function isConnected() {
  return _connected;
}

async function connectDB() {
  const uri = (process.env.MONGODB_URI || '').trim();

  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  // Mongoose connection options
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,   // fail fast during dev if Atlas unreachable
    socketTimeoutMS:          45000,
  });

  _connected = true;
  console.log('[database] Connected to MongoDB —', mongoose.connection.host);

  // ── Auto-reconnect logging ──────────────────────────────────────────────
  mongoose.connection.on('error',        (err) => console.error('[database] Error:', err.message));
  mongoose.connection.on('disconnected', ()    => { _connected = false; console.warn('[database] Disconnected'); });
  mongoose.connection.on('reconnected',  ()    => { _connected = true;  console.log('[database] Reconnected'); });
}

module.exports = connectDB;
module.exports.isConnected = isConnected;
