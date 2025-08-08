const { randomUUID } = require('crypto');

// Attaches a unique request ID to each incoming request for traceability
module.exports = function requestId(req, res, next) {
  const headerId = req.get('X-Request-ID');
  const id = headerId && headerId.length < 100 ? headerId : randomUUID();
  req.requestId = id;
  res.locals.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};
