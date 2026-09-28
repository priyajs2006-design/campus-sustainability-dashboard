'use strict';
/* ============================================================
 * Campus Sustainability Dashboard - DASHBOARD ROUTES
 * GET /api/dashboard/summary - headline KPIs + trend + open alerts
 * GET /api/dashboard/timeline - monthly aggregate for the area chart
 * Auth: verified JWT (role-insensitive read).
 * ========================================================== */
const express = require('express');
const { asyncWrap, rowToCamel } = require('../services/helpers');
const { query } = require('../config/database');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();
router.use(verifyJWT);

/* Energy "kWh" (Decimal -> Number via pool option) per building + latest 12 months. */
const ENERGY_TREND_SQL = `
SELECT MONTH(e.recorded_on) AS month_num,
       YEAR(e.recorded_on)  AS year_num,
       ROUND(SUM(e.energy_kwh), 2) AS energy_kwh
FROM energy_records e
JOIN (SELECT MAX(recorded_on) AS mx FROM energy_records) m
  ON e.recorded_on >= DATE_SUB(m.mx, INTERVAL 11 MONTH)
GROUP BY year_num, month_num
ORDER BY year_num, month_num`;

router.get('/summary', asyncWrap(async (req, res) => {
  const [[buildings], [energy], [water], [waste], [carbon], [alerts]] = await Promise.all([
    query('SELECT COUNT(*) AS cnt FROM buildings'),
    query('SELECT IFNULL(SUM(energy_kwh),0) AS total, ROUND(IFNULL(AVG(energy_kwh),0),2) AS avg FROM energy_records'),
    query('SELECT IFNULL(SUM(total_kL),0) AS total, ROUND(IFNULL(AVG(total_kL),0),2) AS avg FROM water_records'),
    query('SELECT IFNULL(SUM(amount_kg),0) AS total, ROUND(IFNULL(AVG(amount_kg),0),2) AS avg FROM waste_records'),
    query('SELECT IFNULL(SUM(co2e_tons),0) AS total, ROUND(IFNULL(AVG(co2e_tons),0),2) AS avg FROM carbon_records'),
    query("SELECT COUNT(*) AS open_cnt FROM alerts WHERE status IN ('OPEN','IN_REVIEW','ACKNOWLEDGED')")
  ]);
  res.json({
    buildings: Number(buildings.cnt),
    energy_kwh: Number(energy.total),
    energy_avg_kwh: Number(energy.avg),
    water_kL: Number(water.total),
    water_avg_kL: Number(water.avg),
    waste_kg: Number(waste.total),
    carbon_tons: Number(carbon.total),
    open_alerts: Number(alerts.open_cnt)
  });
}));

router.get('/timeline', asyncWrap(async (req, res) => {
  const rows = await query(ENERGY_TREND_SQL);
  res.json(rowToCamel(rows));
}));

module.exports = router;
