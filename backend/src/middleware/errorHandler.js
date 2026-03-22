/**
 * middleware/errorHandler.js
 *
 * Centralised error-handling middleware.
 * Any Express error (thrown or passed to next()) lands here.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const statusCode = err.status || err.statusCode || 500;
  const message    = err.message || 'Internal Server Error';

  console.error(`[errorHandler] ${statusCode} — ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
