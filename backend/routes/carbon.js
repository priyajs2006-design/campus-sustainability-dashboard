'use strict';
/* ============================================================
 * Campus Sustainability Dashboard - CARBON ROUTES
 * GET    /api/carbon            list (building/from/to/scope, paginated)
 * GET    /api/carbon/summary    per-scope totals + reduction %
 * GET    /api/carbon/trend      monthly CO2e totals
 * GET    /api/carbon/scope/:scope
 * GET    /api/carbon/building/:id
 * GET    /api/carbon/:id
 * POST   /api/carbon            create  (MANAGER, ADMIN)
 * PUT    /api/carbon/:id        update  (MANAGER, ADMIN)
 * DELETE /api/carbon/:id        delete  (ADMIN)
 * Parameterized SQL; role guarded; camelCase rows.
 * ========================================================== */
const express = require('express');
const { asyncWrap, rowToCamel, addPagination } = require('../services/helpers');
const { query } = require('../config/database');
const { verifyJWT, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyJWT);

const LIST_SQL = `
SELECT c.record_id, c.building_id, c.recorded_on, c.scope, c.source_name,
       c.co2e_tons, c.baseline_tons, c.reduction_tons, c.recorded_by,
       c.created_at, c.updated_at,
       b.code AS building_code, b.name AS building_name
FROM carbon_records c
JOIN buildings b ON b.building_id = c.building_id
WHERE (? IS NULL OR c.building_id = ?)
  AND (? IS NULL OR c.recorded_on >= ?)
  AND (? IS NULL OR c.recorded_on <= ?)
  AND (? IS NULL OR c.scope = ?)
ORDER BY c.recorded_on DESC, c.record_id DESC
LIMIT ? OFFSET ?`;

const SUMMARY_SQL = `
SELECT scope, ROUND(SUM(co2e_tons), 3) AS co2e_tons,
       ROUND(SUM(baseline_tons), 3) AS baseline_tons,
       ROUND(SUM(reduction_tons), 3) AS reduction_tons,
       ROUND(IFNULL(SUM(reduction_tons) / NULLIF(SUM(baseline_tons), 0), 0) * 100, 1)
         AS reduction_pct
FROM carbon_records GROUP BY scope ORDER BY scope`;

const TREND_SQL = `
SELECT DATE_FORMAT(recorded_on, '%Y-%m') AS month,
       ROUND(SUM(co2e_tons), 3) AS co2e_tons,
       ROUND(SUM(reduction_tons), 3) AS reduction_tons
FROM carbon_records GROUP BY month ORDER BY month`;

router.get('/', asyncWrap(async (req, res) => {
  const { offset, limit, page, pageSize } = addPagination(req.query);
  const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
  const from = req.query.from || null;
  const to = req.query.to || null;
  const scope = req.query.scope || null;
  const rows = await query(LIST_SQL,
    [buildingId, buildingId, from, from, to, to, scope, scope, limit, offset]);
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

router.get('/scope/:scope', asyncWrap(async (req, res) => {
  const rows = await query(
    `SELECT c.*, b.code AS building_code, b.name AS building_name
       FROM carbon_records c JOIN buildings b ON b.building_id = c.building_id
      WHERE c.scope = ? ORDER BY c.recorded_on`,
    [String(req.params.scope)]);
  res.json({ data: rowToCamel(rows) });
});

router.get('/building/:id', asyncWrap(async (req, res) => {
  const rows = await query(
    `SELECT c.*, b.code AS building_code, b.name AS building_name
       FROM carbon_records c JOIN buildings b ON b.building_id = c.building_id
      WHERE c.building_id = ? ORDER BY c.recorded_on`,
    [Number(req.params.id)]);
  res.json({ data: rowToCamel(rows) });
});

router.get('/:id', asyncWrap(async (req, res) => {
  const rows = await query(
    `SELECT c.*, b.code AS building_code, b.name AS building_name
       FROM carbon_records c JOIN buildings b ON b.building_id = c.building_id
      WHERE c.record_id = ?`,
    [Number(req.params.id)]);
  if (!rows[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Carbon record not found.' });
  }
  res.json({ data: rowToCamel(rows[0]) });
});

router.post('/', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const { building_id, recorded_on, scope, source_name, co2e_tons,
          baseline_tons, reduction_tons, recorded_by } = req.body || {};
  if (!building_id || !recorded_on || !scope || !source_name) {
    return res.status(400).json({
      code: 'VALIDATION',
      message: 'building_id, recorded_on, scope and source_name are required.'
    });
  }
  const result = await query(
    `INSERT INTO carbon_records
       (building_id, recorded_on, scope, source_name, co2e_tons,
        baseline_tons, reduction_tons, recorded_by)
     VALUES (?,?,?,?,?,?,?,?)`,
    [building_id, recorded_on, scope, source_name, co2e_tons || 0,
     baseline_tons || 0, reduction_tons || 0, recorded_by || req.auth.userId]
  );
  const rows = await query('SELECT * FROM carbon_records WHERE record_id = ?',
    [result.insertId]);
  res.status(201).json({ data: rowToCamel(rows[0]) });
});

router.put('/:id', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await query('SELECT * FROM carbon_records WHERE record_id = ?', [id]);
  if (!cur[0]) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Carbon record not found.' });
  }
  const { recorded_on, scope, source_name, co2e_tons,
          baseline_tons, reduction_tons } = req.body || {};
  await query(
    `UPDATE carbon_records SET recorded_on=?, scope=?, source_name=?, co2e_tons=?,
       baseline_tons=?, reduction_tons=? WHERE record_id=?`,
    [recorded_on || cur[0].recorded_on, scope || cur[0].scope,
     source_name || cur[0].source_name, co2e_tons ?? cur[0].co2e_tons,
     baseline_tons ?? cur[0].baseline_tons,
     reduction_tons ?? cur[0].reduction_tons, id]
  );
  const rows = await query('SELECT * FROM carbon_records WHERE record_id = ?', [id]);
  res.json({ data: rowToCamel(rows[0]) });
});

router.delete('/:id', requireRole('ADMIN'), asyncWrap(async (req, res) => {
  const result = await query('DELETE FROM carbon_records WHERE record_id = ?',
    [Number(req.params.id)]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Carbon record not found.' });
  }
  res.json({ data: { deleted: true, record_id: Number(req.params.id) } });
});

module.exports = router;
