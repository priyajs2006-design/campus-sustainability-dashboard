'use strict';
/* Campus Sustainability Dashboard - TRANSPORTATION ROUTES
 * GET   /             list (mode filter, paginated)
 * GET   /summary      totals by transport mode
 * GET   /trend        monthly trips + emissions
 * GET   /mode/:mode   records for one mode
 * GET   /building/:id per building
 * GET   /:id          single record
 * POST  /             create (MANAGER, ADMIN)
 * PUT   /:id          update (MANAGER, ADMIN)
 * DELETE /:id         delete (ADMIN)
 * Parameterized SQL; role-guarded; camelCase rows.
 * ========================================================== */
const express = require('express');
const { asyncWrap, rowToCamel, includePagination } = require('../services/helpers');
const { query } = require('../config/database');
const { verifyJWT, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(verifyJWT);

const LIST_SQL = `
SELECT t.record_id, t.recorded_on, t.mode, t.trips_count, t.avg_trip_km,
       t.emissions_tons, t.passes_sold, t.cost_usd, t.recorded_by,
       t.created_at, t.updated_at
FROM campus_transportation t
WHERE (? IS NULL OR t.mode = ?)
ORDER BY t.recorded_on DESC, t.record_id DESC
LIMIT ? OFFSET ?`;

const SUMMARY_SQL = `
SELECT mode,
       ROUND(SUM(trips_count),3)      AS trips_count,
       ROUND(SUM(emissions_tons),3)   AS emissions_tons,
       ROUND(SUM(passes_sold),3)      AS passes_sold,
       ROUND(SUM(cost_usd),3)         AS cost_usd
FROM campus_transportation GROUP BY mode ORDER BY mode`;

const TREND_SQL = `
SELECT DATE_FORMAT(recorded_on,'%Y-%m') AS month,
       ROUND(SUM(trips_count),3)        AS trips_count,
       ROUND(SUM(emissions_tons),3)     AS emissions_tons
FROM campus_transportation GROUP BY month ORDER BY month`;

router.get('/', asyncWrap(async (req, res) => {
  const { offset, limit, page, pageSize } = includePagination(req.query);
  const mode = req.query.mode || null;
  const rows = await query(LIST_SQL, [mode, mode, limit, offset]);
  res.json({ data: rowToCamel(rows), pagination: { page, pageSize, offset } });
});

router.get('/summary', asyncWrap(async (req, res) => {
  const rows = await query(SUMMARY_SQL);
  res.json({ data: rowToCamel(rows) });
});

router.get('/trend', asyncWrap(async (req, res) => {
  const rows = await query(TREND_SQL);
  res.json({ data: rowToCamel(rows) });
});

router.get('/mode/:mode', asyncWrap(async (req, res) => {
  const rows = await query(
    'SELECT * FROM campus_transportation WHERE mode = ? ORDER BY recorded_on',
    [String(req.params.mode)]);
  res.json({ data: rowToCamel(rows) });
});

router.get('/building/:id', asyncWrap(async (req, res) => {
  const month = req.query.month || null;
  if (month) {
    const rows = await query(
      `SELECT t.*, b.code AS building_code, b.name AS building_name
         FROM campus_transportation t
         JOIN buildings b ON b.building_id = t.building_id
        WHERE t.building_id = ? AND DATE_FORMAT(t.recorded_on,'%Y-%m') = ?
        ORDER BY t.recorded_on`,
      [Number(req.params.id), month]);
    return res.json({ data: rowToCamel(rows) });
  }
  const rows = await query(
    `SELECT t.*, b.code AS building_code, b.name AS building_name
       FROM campus_transportation t
       JOIN buildings b ON b.building_id = t.building_id
      WHERE t.building_id = ? ORDER BY t.recorded_on`,
    [Number(req.params.id)]);
  res.json({ data: rowToCamel(rows) });
});

router.get('/:id', asyncWrap(async (req, res) => {
  const rows = await query(
    `SELECT t.*, b.code AS building_code, b.name AS building_name
       FROM campus_transportation t
       JOIN buildings b ON b.building_id = t.building_id
      WHERE t.record_id = ?`,
    [Number(req.params.id)]);
  if (!rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Record not found.' });
  }
  res.json({ data: rowToCamel(rows[0]) });
});

router.post('/', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const { building_id, recorded_on, mode, trips_count, avg_trip_km,
          emissions_tons, passes_sold, cost_usd, recorded_by } = req.body || {};
  if (!recorded_on || !mode) {
    return res.status(400).json({
      code: 'VALIDATION', message: 'recorded_on and mode are required.'
    });
  }
  const result = await query(
    `INSERT INTO campus_transportation
       (building_id, recorded_on, mode, trips_count, avg_trip_km,
        emissions_tons, passes_sold, cost_usd, recorded_by)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [building_id || null, recorded_on, mode, trips_count || 0, avg_trip_km || 0,
     emissions_tons || 0, passes_sold || null, cost_usd || null,
     recorded_by || req.auth.userId]
  );
  const rows = await query('SELECT * FROM campus_transportation WHERE record_id = ?',
    [result.insertId]);
  res.status(201).json({ data: rowToCamel(rows[0]) });
});

router.put('/:id', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await query('SELECT * FROM campus_transportation WHERE record_id = ?', [id]);
  if (!cur[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Record not found.' });
  }
  const { recorded_on, mode, trips_count, avg_trip_km, emissions_tons,
          passes_sold, cost_usd } = req.body || {};
  await query(
    `UPDATE campus_transportation SET recorded_on=?, mode=?, trips_count=?,
       avg_trip_km=?, emissions_tons=?, passes_sold=?, cost_usd=?
     WHERE record_id=?`,
    [recorded_on || cur[0].recorded_on, mode || cur[0].mode,
     trips_count ?? cur[0].trips_count, avg_trip_km ?? cur[0].avg_trip_km,
     emissions_tons ?? cur[0].emissions_tons,
     passes_sold ?? cur[0].passes_sold, cost_usd ?? cur[0].cost_usd, id]);
  const rows = await query('SELECT * FROM campus_transportation WHERE record_id = ?', [id]);
  res.json({ data: rowToCamel(rows[0]) });
});

router.delete('/:id', requireRole('ADMIN'), asyncWrap(async (req, res) => {
  const result = await query('DELETE FROM campus_transportation WHERE record_id = ?',
    [Number(req.params.id)]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Record not found.' });
  }
  res.json({ data: { deleted: true, record_id: Number(req.params.id) } });
});

module.exports = router;
