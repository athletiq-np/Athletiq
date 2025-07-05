// src/utils/apiResponse.js

/**
 * Standardized API response utility
 */
class ApiResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @param {Object} meta - Additional metadata (pagination, etc.)
   */
  static success(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
    const response = {
      success: true,
      message,
      data,
      ...meta
    };

    // Remove null/undefined fields
    Object.keys(response).forEach(key => {
      if (response[key] === null || response[key] === undefined) {
        delete response[key];
      }
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} errors - Detailed error information
   */
  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      ...(errors && { errors })
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors array
   * @param {string} message - Error message
   */
  static validationError(res, errors, message = 'Validation failed') {
    return res.status(400).json({
      success: false,
      message,
      errors: errors.map(err => ({
        field: err.param || err.path,
        message: err.msg || err.message,
        value: err.value
      }))
    });
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = 'Access forbidden') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  /**
   * Conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static conflict(res, message = 'Resource conflict') {
    return res.status(409).json({
      success: false,
      message
    });
  }

  /**
   * Too many requests response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static tooManyRequests(res, message = 'Too many requests') {
    return res.status(429).json({
      success: false,
      message
    });
  }

  /**
   * Paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of data
   * @param {Object} pagination - Pagination info
   * @param {string} message - Success message
   */
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: parseInt(pagination.currentPage),
        totalPages: parseInt(pagination.totalPages),
        totalCount: parseInt(pagination.totalCount),
        limit: parseInt(pagination.limit),
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev
      }
    });
  }

  /**
   * Created response
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   */
  static created(res, data, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Updated response
   * @param {Object} res - Express response object
   * @param {*} data - Updated resource data
   * @param {string} message - Success message
   */
  static updated(res, data, message = 'Resource updated successfully') {
    return ApiResponse.success(res, data, message, 200);
  }

  /**
   * Deleted response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   */
  static deleted(res, message = 'Resource deleted successfully') {
    return res.status(200).json({
      success: true,
      message
    });
  }

  /**
   * No content response
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

/**
 * Pagination helper
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total number of items
 */
const getPaginationInfo = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = parseInt(page);
  
  return {
    currentPage,
    totalPages,
    totalCount,
    limit: parseInt(limit),
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    offset: (currentPage - 1) * limit
  };
};

/**
 * Build database query with pagination and filters
 * @param {Object} options - Query options
 */
const buildQuery = (options = {}) => {
  const {
    baseQuery,
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    filters = {}
  } = options;

  let query = baseQuery;
  const params = [];
  let paramIndex = 1;

  // Add filters
  const whereConditions = [];
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      if (typeof filters[key] === 'string' && key.includes('search')) {
        whereConditions.push(`${key.replace('_search', '')} ILIKE $${paramIndex}`);
        params.push(`%${filters[key]}%`);
      } else {
        whereConditions.push(`${key} = $${paramIndex}`);
        params.push(filters[key]);
      }
      paramIndex++;
    }
  });

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  // Add sorting
  query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

  // Add pagination
  const pagination = getPaginationInfo(page, limit, 0); // totalCount will be calculated separately
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pagination.limit, pagination.offset);

  return {
    query,
    params,
    pagination
  };
};

module.exports = {
  ApiResponse,
  getPaginationInfo,
  buildQuery
};
