-- ============================================================================
-- Campus Sustainability Dashboard - WATER SEED (DEMO/DEMO sample data)
-- Clearly-labelled synthetic baselines so the Water page, charts, alerts and
-- reports ALWAYS have something meaningful. NOT live utility or sensor data.
-- buildings(6) x 12 months = 72 rows.
-- ============================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO water_records
  (building_id, recorded_on, meter_id, total_kL, potable_kL, rainwater_kL,
   recycled_kL, cost_usd, leak_alerts, recorded_by)
SELECT b.building_id,
       d.recorded_on,
       CONCAT(b.code, '-WM-', DATE_FORMAT(d.recorded_on, '%Y%m')),
       ROUND(2500 + RAND()*2200, 1),
       ROUND(1900 + RAND()*1500, 1),
       ROUND(120  + RAND()*380, 1),
       ROUND(90   + RAND()*300, 1),
       ROUND(3200 + RAND()*2800, 2),
       FLOOR(RAND()* \f),
       (SELECT user_id FROM users WHERE username = 'mgr.energy' LIMIT 1)
FROM buildings b
JOIN (
  SELECT '2025-07-01' recorded_on UNION ALL SELECT '2025-08-01' UNION ALL SELECT '2025-09-01'
  UNION ALL SELECT '2025-10-01' UNION ALL SELECT '2025-11-01' UNION ALL SELECT '2025-12-01'
  UNION ALL SELECT '2026-01-01' UNION ALL SELECT '2026-02-01' UNION ALL SELECT '2026-03-01'
  UNION ALL SELECT '2026-04-01' UNION ALL SELECT '2026-05-01' UNION ALL SELECT '2026-06-01'
) d ON 1=1;
SELECT COUNT(*) AS water_seed_rows FROM water_records;
