/**
 * utils/asyncHandler.js
 *
 * Wraps an async Express route handler so thrown errors are
 * automatically forwarded to next() — no try/catch needed in routes.
 *
 * Usage:
 *   router.get('/foo', asyncHandler(async (req, res) => { ... }));
 */

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
