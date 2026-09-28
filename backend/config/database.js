'use strict';
/* ============================================================================
 * Campus Sustainability Dashboard - DATABASE POOL
 * Central mysql2/promise pool. Config comes from environment variables ONLY;
 * there are no hardcoded credentials or secrets anywhere in the backend.
 * ========================================================================== */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'sust_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_sustainability',
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
  decimalNumbers: true
});

/* Quick connectivity check used by /api/monitoring, health probes and boot. */
async function ping() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT 1 AS ok');
    return rows && rows.length === 1 && rows[0].ok === 1;
  } finally {
    conn.release();
  }
}

/* Lightweight query helper with raw integer/text result coercion (mysql2
 * returns DECIMAL as string by default; we keep numbers as numbers and
 * DATETIME as-is for the charts/reports layer). */
async function query(sql, params) {
  const [rows] = await pool.query(sql, params || []);
  return rows;
}

module.exports = { pool, ping, query };
