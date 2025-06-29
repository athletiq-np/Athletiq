const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  console.log("authMiddleware: checking auth...");
  // Accept both 'authorization' and 'Authorization'
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    console.log("authMiddleware: No Authorization header");
    return res.status(401).json({ message: "No token provided" });
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    console.log("authMiddleware: Malformed Authorization header");
    return res.status(401).json({ message: "Malformed token" });
  }
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("authMiddleware: Authenticated user", decoded);
    next();
  } catch (err) {
    console.log("authMiddleware: Invalid token");
    return res.status(401).json({ message: "Invalid token" });
  }
};
