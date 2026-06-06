'use strict';
const jwt = require('jsonwebtoken');

// FIX 5: Use same fallback secret as authController so token verification
// never fails due to env var mismatch between sign and verify calls.
const JWT_SECRET = process.env.JWT_SECRET || 'silverlink_dev_secret_fallback_2024';

const authMiddleware = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token required.' });
  }
  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token is empty.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const msg =
      err.name === 'TokenExpiredError' ? 'Session expired. Please sign in again.' :
      err.name === 'JsonWebTokenError'  ? 'Invalid session token. Please sign in again.' :
                                          'Authentication failed.';
    return res.status(401).json({ success: false, message: msg });
  }
};

module.exports = authMiddleware;
