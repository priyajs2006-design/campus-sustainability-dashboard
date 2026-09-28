'use strict';
/* Auth middleware: verifyJWT + requireRole.
 * Secrets come from env only; dotenv is loaded in server.js BEFORE this
 * file is required at request time, so nothing throws at module load. */
const jwt = require('jsonwebtoken');

function getSecret() {
  const s = process.env.JWT_SECRET || '';
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET env var missing (min 32 chars). See .env.example');
  }
  return s;
}

function verifyJWT(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing Bearer token.' });
    }
    const payload = jwt.verify(m[1], getSecret());
    if (!payload || !payload.sub || !payload.role) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token payload.' });
    }
    req.auth = {
      userId: payload.sub,
      username: payload.username || '',
      role: payload.role
    };
    return next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ code, message: 'Authentication failed.' });
  }
}

function requireRole(...roles) {
  return function guard(req, res, next) {
    if (!req.auth) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authenticate first.' });
    }
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Your role cannot perform this action.' });
    }
    return next();
  };
}

module.exports = { verifyJWT, requireRole };
