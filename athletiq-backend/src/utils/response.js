// Unified response helper to ensure consistent API output shapes
// Usage: sendResponse(res, { status, success, message, data, errors, meta })
function sendResponse(res, { success = true, status = 200, message = '', data = null, errors = null, meta = null } = {}) {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (errors) payload.errors = errors;
  if (meta) payload.meta = meta;
  if (res.locals?.requestId) payload.request_id = res.locals.requestId;
  return res.status(status).json(payload);
}

module.exports = { sendResponse };
