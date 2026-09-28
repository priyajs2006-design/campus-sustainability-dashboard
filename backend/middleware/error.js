'use strict';
/* ============================================================
 * Campus Sustainability Dashboard - ERROR HANDLERS
 * Single shape for all API errors: { code, message, details? }.
 * ========================================================== */

/* 404 handler - mounted last in the API router. */
function notFound(req, res) {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Endpoint nicht gefunden: ' + req.method + ' ' + req.originalUrl
  });
}

/* Central error handler - mounted last in the app. Logs the real
 * error server-side but returns no stack/internal detail to the client. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err.status) && err.status >= 400 ? err.status : 500;
  const body = {
    code: err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    message: err.expose === false ? 'Internal server error.' : (err.message || 'Unexpected error.')
  };
  if (err.details) body.details = err.details;
  if (status >= 500) console.error('[API ERROR]', err);
  res.status(status).json(body);
}

/* Build a standard AppError. Usage: throw errorWith(400, 'BAD_REQUEST', 'msg') */
function errorWith(status, code, message, details) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  if (details !== undefined) e.details = details;
  return e;
}

module.exports = { notFound, errorHandler, errorWith };
