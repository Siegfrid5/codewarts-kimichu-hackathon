/**
 * GABAYANI — Global Error Handler Middleware
 * 
 * Catches all errors thrown in route handlers and returns
 * structured JSON error responses. Prevents stack traces
 * from leaking to clients in production.
 */

/**
 * Custom application error with HTTP status code.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Express error-handling middleware (4 args required).
 */
function errorHandler(err, req, res, _next) {
  // Default to 500 if no status code set
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the full error in development
  if (!isProduction) {
    console.error('❌ Error:', err);
  } else {
    // In production, log without stack trace for 4xx, full for 5xx
    if (statusCode >= 500) {
      console.error(`❌ [${statusCode}] ${err.message}`, err.stack);
    } else {
      console.warn(`⚠️ [${statusCode}] ${err.message}`);
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(err.details && { details: err.details }),
      ...(!isProduction && { stack: err.stack }),
    },
  });
}

/**
 * Wrap async route handlers to catch promise rejections.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { AppError, errorHandler, asyncHandler };
