'use strict';
/* ============================================================
 * Campus Sustainability Dashboard - WASTE ROUTES
 * GET    /api/waste            list (paginated, filters)
 * GET    /api/waste/summary    totals + diversion
 * GET    /api/waste/trend      monthly totals
 * GET    /api/waste/building/:id
 * GET    /api/waste/:id
 * POST   /api/waste            (MANAGER, ADMIN)
 * PUT    /api/waste/:id        (MANAGER, ADMIN)
 * DELETE /api/waste/:id        (ADMIN)
 * Parameterized SQL, camelCase rows, role-guarded.
 * ========================================================== */
const express = require('express');
const { asyncWrap, rowToCamel, addPagination, addPaging } = require('../services/helpers');
const { query } = require('../config/database');
const { verifyJWT, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(verifyJWT);

const LIST_SQL = `
SELECT w.record_id, w.building_id, w.recorded_on, w.waste_type,
       w.amount_kg, w.diverted_kg, w.hauler, w.service_fee_usd,
       w.recorded_by, w.created_at, w.updated_at,
       b.code AS building_code, b.name AS building_name
FROM waste_records w
JOIN buildings b ON b.building_id = w.building_id
WHERE (? IS NULL OR w.building_id = ?)
  AND (? IS NULL OR w.recorded_on >= ?)
  AND (? IS NULL OR w.recorded_on <= ?)
ORDER BY w.recorded_on DESC, w.record_id DESC
LIMIT ? OFFSET ?`;

const SUMMARY_SQL = `
SELECT COUNT(*) AS total_records,
       ROUND(SUM(amount_kg),2) AS total_kg,
       ROUND(AVG(amount_kg),2) AS avg_kg,
       ROUND(SUM(diverted_kg),2) AS diverted_kg,
       ROUND(IFNULL(SUM(diverted_kg)/NULLIF(SUM(amount_kg),0),0)*100,1) AS diversion_pct
FROM waste_records`;

router.get('/summary', asyncWrap(async (req, res) => {
  const [s] = await query(SUMMARY_SQL);
  res.json({ data: rowToCamel(s) });
}));

router.get('/trend', asyncWrap(async (req, res) => {
  const rows = await query(`
    SELECT DATE_FORMAT(recorded_on, '%Y-%m') AS month,
           ROUND(SUM(amount_kg),2) AS total_kg,
           ROUND(SUM(diverted_kg),2) AS diverted_kg
    FROM waste_records GROUP BY month ORDER BY month`);
  res.json({ data: rows });
}));

router.get('/building/:id', asyncWrap(async (req, res) => {
  const rows = await query(
    `SELECT * FROM waste_records WHERE building_id = ? ORDER BY recorded_on`,
    [Number(req.params.id)]);
  res.json({ data: rows.map(rowToCamel) });
}));

router.get('/:id', asyncWrap(async (req, res) => {
  const rows = await query(
    `SELECT w.*, b.code AS building_code, b.name AS building_name
       FROM waste_records w JOIN buildings b ON b.building_id = w.building_id
      WHERE w.record_id = ?`, [Number(req.params.id)]);
  if (!rows[0]) return res.status(404).json({ code: 'NOT_FOUND', message: 'Waste record not found.' });
  res.json({ data: rowToCamel(rows[0]) });
}));

router.post('/', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const r = req.body || {};
  if (!r.building_id || !r.recorded_on || !r.waste_type || r.amount_kg == null) {
    return res.status(400).json({
      code: 'VALIDATION',
      message: 'building_id, recorded_on, waste_type and amount_kg are required.'
    });
  }
  const result = await query(
    `INSERT INTO waste_records
       (building_id, recorded_on, waste_type, amount_kg, diverted_kg,
        hauler, service_fee_usd, recorded_by)
     VALUES (?,?,?,?,?,?,?,?)`,
    [r.building_id, r.recorded_on, r.waste_type, r.amount_kg,
     r.diverted_kg || 0, r.hauler, r.service_fee_usd, req.auth.userId]
  );
  const rows = await query('SELECT * FROM waste_records WHERE record_id = ?', [result.insertId]);
  res.status(201).json({ data: rowToCamel(rows[0]) });
}));

router.put('/:id', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await query('SELECT * FROM waste_records WHERE record_id = ?', [id]);
  if (!cur[0]) return res.status(404).json({ code: 'NOT_FOUND', message: 'Waste record not found.' });
  const r = req.body || {};
  await query(
    `UPDATE waste_records SET recorded_on=?, waste_type=?, amount_kg=?,
       diverted_kg=?, hauler=?, service_fee_usd=? WHERE record_id=?`,
    [r.recorded_on || cur[0].recorded_on, r.waste_type || cur[0].waste_type,
     r.amount_kg ?? cur[0].amount_kg, r.diverted_kg,
     r.hauler, r.service_fee_usd, id]
  );
  const rows = await query('SELECT * FROM waste_records WHERE record_id = ?', [id]);
  res.json({ data: rowToCamel(rows[0]) });
}));

router.delete('/:id', requireRole('ADMIN'), asyncWrap(async (req, res) => {
  const result = await query('DELETE FROM waste_records WHERE record_id = ?', [Number(req.params.id)]);
  if (result.affectedRows === 0) return res.status(404).json({ code: 'NOT_FOUND', message: 'Waste record not found.' });
  res.json({ data: { deleted: true, record_id: Number(req.params.id) } });
}));

router.get('/', asyncWrap(async (req, res) => {
  const p = addPagination(req.query);
  const { limit, offset } = addPaging(p);
  const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
  const from = req.query.from || null;
  const to = req.query.to || null;
  const rows = await query(LIST_SQL,
    [buildingId, buildingId, from, from, to, to, limit, offset]);
  res.json({ data: rows.map(rowToCamel), pagination: p });
}));

module.exports = router;
