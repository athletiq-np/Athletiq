// Standardized error response helper
function sendError(res, statusCode = 500, code = 'INTERNAL_ERROR', message = 'An error occurred', errors = []) {
  return res.status(statusCode).json({
    success: false,
    code,
    message,
    errors
  });
}

module.exports = { sendError };
