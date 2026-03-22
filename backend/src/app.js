/**
 * app.js — Express application factory.
 *
 * Separating the app from the server allows clean unit testing
 * without binding to a port.
 */

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

const inspectionRoutes = require('./routes/inspection.routes');
const reportRoutes     = require('./routes/report.routes');
const healthRoutes     = require('./routes/health.routes');
const detectionRoutes  = require('./routes/detection.routes');
const errorHandler     = require('./middleware/errorHandler');

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));          // JSON bodies (base-64 frames)
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Global rate limiter ─────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 100,              // max 100 requests per IP per minute
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use('/api', limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health',      healthRoutes);
app.use('/api/detect',      detectionRoutes);
app.use('/api/inspection',  inspectionRoutes);
app.use('/api/report',      reportRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Centralised error handler (must be last) ────────────────────────────────
app.use(errorHandler);

module.exports = app;
