'use strict';
/* ============================================================
 * Energy module (README/REST plan)
 * GET /api/energy - paginated "energy_records" (filters by buildingId,
 *   from/to, join optional). Protected.
 * GET /api/energy/summary
 * GET /api/energy/trend - monthly kWh totals
 * GET /api/energy/building/:id
 * GET /api/energy/records/:id
 * POST /api/energy
 * PUT /api/energy/:id
 * DELETE /api/energy/:id
 * ========================================================== */
const express = require('express');
const { asyncWrap, rowToCamel, addPagination } = require('../services/helpers');
const { query } = require('../config/database');
const { verifyJWT, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(verifyJWT);

const LIST_SQL = `
SELECT e.record_id, e.building_id, e.recorded_on, e.energy_kwh,
       e.peak_demand_kw, e.carbon_kgs, e.cost_usd, e.source,
       e.recorded_by, e.created_at, e.updated_at,
       b.code AS building_code, b.name AS building_name
FROM energy_records e
JOIN buildings b ON b.building_id = e.building_id
WHERE (? IS NULL OR e.building_id = ?)
  AND (? IS NULL OR e.recorded_on >= ?)
  AND (? IS NULL OR e.recorded_on <= ?)
ORDER BY e.recorded_on DESC, e.record_id DESC
LIMIT ? OFFSET ?`;

/* POST /api/energy - create (MANAGER, ADMIN) */
router.post('/', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const { building_id, recorded_on, energy_kwh, peak_demand_kw,
          carbon_kgs, cost_usd, source, recorded_by } = req.body || {};
  if (!building_id || !recorded_on || energy_kwh == null) {
    return res.status(400).json({ code: 'VALIDATION', message: 'building_id, recorded_on and energy_kwh are required.' });
  }
  const result = await query(
    `INSERT INTO energy_records
       (building_id, recorded_on, energy_kwh, peak_demand_kw,
        carbon_kgs, cost_usd, source, recorded_by)
     VALUES (?,?,?,?,?,?,?,?)`,
    [building_id, recorded_on, energy_kwh, peak_demand_kw,
     carbon_kgs, cost_usd, source || 'GRID', recorded_by || req.auth.userId]
  );
  const rows = await query('SELECT * FROM energy_records WHERE record_id = ?', [result.insertId]);
  res.status(201).json({ data: rowToCamel(rows[0]) });
}));

router.put('/:id', requireRole('MANAGER', 'ADMIN'), asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  const { recorded_on, energy_kwh, peak_demand_kw, carbon_kgs, cost_usd, source } = req.body || {};
  const cur = await query('SELECT * FROM energy_records WHERE record_id = ?', [id]);
  if (!cur[0]) return res.status(404).json({ code: 'NOT_FOUND', message: 'Energy record not found.' });
  await query(
    `UPDATE energy_records SET recorded_on=?, energy_kwh=?, peak_demand_kw=?,
       carbon_kgs=?, cost_usd=?, source=? WHERE record_id=?`,
    [recorded_on || cur[0].recorded_on, energy_kwh ?? cur[0].energy_kwh,
     peak_demand_kw, carbon_kgs, cost_usd, source || cur[0].source, id]
  );
  const rows = await query('SELECT * FROM energy_records WHERE record_id = ?', [id]);
  res.json({ data: rowToCamel(rows[0]) });
}));

router.delete('/:id', requireRole('ADMIN'), asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  const result = await query('DELETE FROM energy_records WHERE record_id = ?', [id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Energy record not found.' });
  }
  res.json({ data: { deleted: true, record_id: id } });
}));

router.get('/summary', asyncWrap(async (req, res) => {
  const [s] = await query(`
    SELECT COUNT(*) AS total_records,
           ROUND(SUM(energy_kwh), 2) AS total_kwh,
           ROUND(AVG(energy_kwh), 2) AS avg_kwh_per_building,
           ROUND(SUM(energy_kwh) BY month) AS monthly
  `);
  res.json({ data: rowToCamel(s) });
}));

router.get('/trend', asyncWrap(async (req, res) => {
  const rows = await query(`
    SELECT DATE_FORMAT(recorded_on, '%Y-%m') AS month,
           ROUND(SUM(energy_kwh), 2) AS total_kwh
    FROM energy_records
    GROUP BY month ORDER BY month`);

  res.json({ data: rows });
}));

router.get('/building/:id', asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await query(
    `SELECT * FROM energy_records WHERE building_id = ? ORDER BY recorded_on`, [id]);
  res.json({ data: rowToCamel(rows) });
}));

router.get('/records/:id', asyncWrap(async (req, res) => {
  const rows = await query('SELECT * FROM energy_records WHERE record_id = ?', [Number(req.params.id)]);
  if (!rows[0]) return res.status(404).json({ code: 'NOT_FOUND', message: 'Energy record not found.' });
  res.json({ data: rowToCamel(rows[0]) });
}));

router.get('/', asyncWrap(async (req, res) => {
  const { offset, limit, page, pageSize } = addPagination(req.query);
  const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
  const from = req.query.from || null;
  const to = req.query.to || null;
  const rows = await query(LIST_SQL, [buildingId, buildingId, from, from, to, to, limit, offset]);
  res.json({ data: rowToCamel(rows), pagination: { page, pageSize, offset } });
}));

module.exports = router;
