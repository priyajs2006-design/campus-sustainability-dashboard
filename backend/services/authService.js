'use strict';
/* ============================================================
 * Campus Sustainability Dashboard - AUTH SERVICE
 * bcrypt password hashing + JWT issue/verify. Secrets ALWAYS
 * come from env (never hardcoded). Roles: ADMIN, MANAGER,
 * STUDENT. DEMO users are seeded; production accounts should
 * use register + a strong password.
 * ========================================================== */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const BCRYPT_ROUNDS = 10;

function secret() {
  const s = (process.env.JWT_SECRET || '').trim();
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET env variable missing or too short (min 32 chars).');
  }
  return s;
}

function createToken(user) {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '8h').trim();
  return jwt.sign(
    { sub: String(user.user_id), username: user.username, role: user.role },
    secret(),
    { expiresIn, issuer: 'campus-sustainability', audience: 'dashboard-web' }
  );
}

function publicUser(u) {
  return {
    user_id: u.user_id,
    username: u.username,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    is_active: !!u.is_active,
    created_at: u.created_at
  };
}

async function findByUsername(username) {
  const [rows] = await pool.query(
    'SELECT user_id, username, full_name, email, password_hash, role, is_active, created_at FROM users WHERE username = ? AND is_active = 1 LIMIT 1',
    [username]
  );
  return rows.length ? rows[0] : null;
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT user_id FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
    [email]
  );
  return rows.length ? rows[0] : null;
}

async function createUser({ username, full_name, email, password, role }) {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const allowedRoles = ['ADMIN', 'MANAGER', 'STUDENT'];
  if (!allowedRoles.includes(role)) {
    throw new Error('Role must be one of: ADMIN, MANAGER, STUDENT.');
  }
  const [result] = await pool.query(
    `INSERT INTO users (username, full_name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [username, full_name, email, hash, role]
  );
  const [rows] = await pool.query(
    'SELECT user_id, username, full_name, email, role, is_active, created_at FROM users WHERE user_id = ?',
    [result.insertId]
  );
  return rows[0];
}

async function authenticate(username, password) {
  const user = await findByUsername(username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return user;
}

module.exports = {
  createToken,
  publicUser,
  createUser,
  findByUsername,
  findByEmail,
  authenticate
};
