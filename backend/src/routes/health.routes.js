/**
 * routes/health.routes.js — Health-check endpoints.
 * Returns server + database + uptime information.
 */

const router = require('express').Router();
const { isConnected } = require('../config/database');

// GET /api/health
router.get('/', (_req, res) => {
  const dbStatus = isConnected() ? 'connected' : 'disconnected';
  const code     = isConnected() ? 200 : 206; // 206 = partial — server up, db down

  res.status(code).json({
    success:   true,
    status:    'healthy',
    database:  dbStatus,
    uptime:    Math.floor(process.uptime()),   // seconds
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
  });
});

module.exports = router;
