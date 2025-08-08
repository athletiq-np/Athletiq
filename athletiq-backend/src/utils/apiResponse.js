// LEGACY RESPONSE ADAPTER (Soft-deprecated)
// ----------------------------------------
// Older test suites & some routes still import { ApiResponse, getPaginationInfo }.
// We provide a thin adapter over the new unified sendResponse helper to avoid
// widespread breaking changes while migration completes.
// NOTE: New code should import { sendResponse } from ./response instead.

const { sendResponse } = require('./response');

function success(res, data = undefined, message = 'Success', status = 200, meta = undefined) {
  // For legacy unit tests we must NOT wrap the response in { status, success } when no meta
  // They expect exactly: { success, message, data? , pagination? }
  if (meta && meta.pagination) {
    const payload = { success: true, message };
    if (data !== undefined) payload.data = data;
    // Legacy flattened pagination only (unit test asserts exact object, so exclude meta wrapper)
    payload.pagination = meta.pagination;
    if (res.locals?.requestId) payload.request_id = res.locals.requestId;
    return res.status(status).json(payload);
  }
  const payload = { success: true, message };
  if (data !== undefined) payload.data = data;
  return res.status(status).json(payload);
}

function error(res, message = 'Error', status = 400, errors = undefined) {
  return sendResponse(res, { status, success: false, message, errors });
}

function unauthorized(res, message = 'Unauthorized access') {
  return error(res, message, 401);
}

function forbidden(res, message = 'Forbidden access') {
  return error(res, message, 403);
}

function notFound(res, message = 'Resource not found') {
  return error(res, message, 404);
}

function created(res, data, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

function deleted(res, message = 'Resource deleted successfully') {
  return success(res, undefined, message, 200);
}

// Pagination helper retained for legacy unit tests
function getPaginationInfo(page = 1, limit = 10, totalCount = 0) {
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  totalCount = Number(totalCount) || 0;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(totalCount / limit)) : 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * limit;
  return {
    currentPage,
    totalPages,
    totalCount,
    limit,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    offset
  };
}

const ApiResponse = { success, error, unauthorized, forbidden, notFound, created, deleted };

module.exports = { ApiResponse, getPaginationInfo };
