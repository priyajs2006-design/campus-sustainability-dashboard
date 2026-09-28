'use strict';
/* ============================================================
 * Campus Sustainability Dashboard - SHARED HELPERS
 * - asyncWrap: wrap async route handlers (Express 4).
 * - rowToCamel: mysql2 rows (snake_case) to camelCase keys used
 *   by the frontend (charts expect e.g. energyKwh / month labels).
 * - addPagination: accept ?page=&pageSize= and clamp.
 * ========================================================== */

function asyncWrap(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/* Convert snake_case object keys to camelCase (recursive, arrays ok). */
function rowToCamel(o) {
  if (Array.isArray(o)) return o.map(rowToCamel);
  if (!o || typeof o !== 'object') return o;
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    const camel = k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
    out[camel] = rowToCamel(v);
  }
  return out;
}

/* Clamp & default MySQL-safe pagination fields. */
function addPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(500, Math.max(1, parseInt(query.pageSize, 10) || 50));
  return { offset: (page - 1) * pageSize, limit: pageSize, page, pageSize };
}

module.exports = { asyncWrap, rowToCamel, addPagination };
