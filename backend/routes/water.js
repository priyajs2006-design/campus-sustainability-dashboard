'use strict';
/* ============================================================
 * Water module (README/REST plan)
 * GET /api/water            - paginated lists
 * GET /api/water/summary
 * GET /api/water/trend      - monthly kL
 * GET /api/water/building/:id
 * GET /api/water/:id
 * POST/PUT/DELETE (MANAGER, ADMIN)
 * ========================================================== */
const express = require('express');
const { asyncWrap, rowToCamel, addPagination } = require('../services/helpers');
const { query } = require('../config/database');
const { verifyJWT, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(verifyJWT);

/* POST /api/water */
router.post('/', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const { building_id, recorded_on, total_kL: total_kl, potable_kL, rainwater_kL,
          recycled_kL, cost_usd, meter_id, meter_serial, recorded_by } = req.body || {};
  const b = await query('SELECT building_id FROM buildings WHERE building_id = ?', [building_id]);
  if (!b[0] || !recorded_on || total_kl == null) {
    return res.status(400).json({ code: 'VALIDATION', message: 'Valid building_id, recorded_on and total_kL are required.' });
  }
  const result = await query(
    `INSERT INTO water_records
       (building_id, recorded_on, meter_id, total_kL, potable_kL,
        rainwater_kL, recycled_kL, cost_usd, recorded_by)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [building_id, recorded_on, meter_id, total_kl, potable_kL,
     rainwater_kL, recycled_kL, cost_usd, recorded_by || req.auth.userId]
  );
  const rows = await query('SELECT * FROM water_records WHERE record_id = ?', [result.insertId]);
  res.status(201).json({ data: rowToCamel(rows[0]) });
}));

router.put('/:id', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await query('SELECT * FROM water_records WHERE record_id = ?', [id]);
  if (!cur[0]) return res.status(404).json({ code: 'NOT_FOUND', message: 'Water record not found.' });
  const { recorded_on, total_kL, potable_kL, rainwater_kL, recycled_kL, cost_usd } = req.body || {};
  await query(
    `UPDATE water_records SET recorded_on=?, total_kL=?, potable_kL=?, rainwater_kL=?,
       recycled_kL=?, cost_usd=? WHERE record_id=?`,
    [recorded_on || cur[0].recorded_on, total_kL ?? cur[0].total_kL,
     potable_kL, rainwater_kL, recycled_kL, cost_usd, id]
  );
  const rows = await query('SELECT * FROM water_records WHERE record_id = ?', [id]);
  res.json({ data: rowToCamel(rows[0]) });
}));

router.delete('/:id', requireRole('ADMIN'), asyncWrap(async (req, res) => {
  const result = await query('DELETE FROM water_records WHERE record_id = ?', [Number(req.params.id)]);
  if (result.affectedRows === 0) return res.status(404).json({ code: 'NOT_FOUND', message: 'Water record not found.' });
  res.json({ data: { deleted: true, record_id: Number(req.params.id) } });
}));

router.get('/summary', asyncWrap(async (req, res) => {
  const [s] = await query(`
    SELECT COUNT(*) AS total_records,
           ROUND(SUM(total_kL), 2) AS total_kL,
           ROUND(AVG(total_kL), 2) AS avg_kL_per_building
    FROM water_records`);
  res.json({ data: rowToCamel(s) });
}));

router.get('/trend', asyncWrap(async (req, res) => {
  const rows = await query(`
    SELECT DATE_FORMAT(recorded_on, '%Y-%m') AS month,
           ROUND(SUM(total_kL), 2) AS total_kL
    FROM water_records GROUP BY month ORDER BY month`);
  res.json({ data: rows });
}));

router.get('/building/:id', asyncWrap(async (req, res) => {
  const rows = await query(
    `SELECT * FROM water_records WHERE building_id = ? ORDER BY recorded_on`, [Number(req.params.id)]);
  res.json({ data: rowToCamel(rows) });
}));

router.get('/:id', asyncWrap(async (req, res) => {
  const rows = await query('SELECT * FROM water_records WHERE record_id = ?', [Number(req.params.id)]);
  if (!rows[0]) return res.status(404).json({ code: 'NOT_FOUND', message: 'Water record not found.' });
  res.json({ data: rowToCamel(rows[0]) });
}));

router.get('/', asyncWrap(async (req, res) => {
  const { offset, limit, page, pageSize } = addPagination(req.query);
  const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
  const rows = await query(
    `SELECT w.*, b.code AS building_code, b.name AS building_name
       FROM water_records w JOIN buildings b ON b.building_id = w.building_id
      WHERE (? IS NULL OR w.building_id = ?)
      ORDER BY w.recorded_on DESC, w.record_id DESC LIMIT ? OFFSET ?`,
    [buildingId, buildingId, limit, offset]);
  res.json({ data: rowToCamel(rows), pagination: { page, pageSize, offset } });
}));

module.exports = router;
