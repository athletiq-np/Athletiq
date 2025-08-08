// Lightweight pagination helpers migrated from legacy apiResponse
function getPaginationInfo(page = 1, limit = 50, totalCount = 0) {
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 50;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    offset: (page - 1) * limit
  };
}

module.exports = { getPaginationInfo };
