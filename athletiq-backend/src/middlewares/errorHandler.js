/**
 * @desc    Centralized error handling middleware.
 * This is our application's safety net. It catches any error passed
 * by 'next(error)' from our controllers, logs it, and sends a clean,
 * standardized JSON response back to the client.
 */
const errorHandler = (err, req, res, next) => {
  // Log the full error to the console for debugging.
  console.error(err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    // Only show the detailed error stack in development mode for security.
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = {
  errorHandler,
};