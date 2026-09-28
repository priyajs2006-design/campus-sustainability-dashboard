'use strict';
/* ============================================================
 * Campus Sustainability Dashboard - AUTH ROUTES
 * POST /api/auth/register  (public)
 * POST /api/auth/login     (public)
 * GET  /api/auth/me        (protected)
 * ========================================================== */
const express = require('express');
const { rowToCamel, asyncWrap, errorWith } = require('../services/helpers');
const authService = require('../services/authService');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,40}$/;

/* POST /api/auth/register */
router.post('/register', asyncWrap(async (req, res) => {
  const { username, full_name, email, password, role } = req.body || {};
  if (!username || !USERNAME_RE.test(username)) {
    throw errorWith(400, 'VALIDATION', 'Invalid username (3-40 chars, letters/numbers/._-).');
  }
  if (!email || !EMAIL_RE.test(String(email).toLowerCase())) {
    throw errorWith(400, 'VALIDATION', 'A valid email is required.');
  }
  if (!password || String(password).length < 8) {
    throw errorWith(400, 'VALIDATION', 'Password must be at least 8 characters.');
  }
  if (await authService.findByEmail(email)) {
    throw errorWith(409, 'EMAIL_TAKEN', 'That email is already registered.');
  }
  if (await authService.findByUsername(username)) {
    throw errorWith(409, 'USERNAME_TAKEN', 'That username is already taken.');
  }
  const user = await authService.createUser({
    username, full_name: full_name || username, email, password, role: role || 'STUDENT'
  });
  const token = authService.createToken(user);
  res.status(201).json({ token, user: rowToCamel(user) });
}));

/* POST /api/auth/login */
router.post('/login', asyncWrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    throw errorWith(400, 'VALIDATION', 'username and password are required.');
  }
  const user = await authService.authenticate(username, password);
  if (!user) {
    throw errorWith(401, 'INVALID_CREDENTIALS', 'Invalid username or password.');
  }
  const token = authService.createToken(user);
  res.json({ token, user: rowToCamel(user) });
}));

/* GET /api/auth/me */
router.get('/me', verifyJWT, asyncWrap(async (req, res) => {
  const user = await authService.findByUsername(req.auth.username);
  if (!user) {
    throw errorWith(404, 'NOT_FOUND', 'User no longer exists.');
  }
  res.json({ user: rowToCamel(user) });
}));

module.exports = router;
