-- ============================================================
-- Campus Sustainability Dashboard - MONITORING SEED (DEMO)
-- One status row per building (6), current_metric + last timestamps.
-- Clearly DEMO; production would come from live sensor/SCADA feeds.
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
SET @adm = (SELECT user_id FROM users WHERE username='adm.campus' LIMIT 1);

INSERT INTO monitoring_status
  (building_id, status, current_metric, last_reading_at, notes, checked_by)
SELECT b.building_id, d.status, d.current_metric, d.last_reading_at,
       d.notes, @adm
FROM buildings b
JOIN (
  SELECT 1 AS ord,   'NORMAL'   AS status, 'kWh this hour' AS current_metric,
         '2026-01-15 09:00:00' AS last_reading_at, 'All scopes reporting normally. DEMO.' AS notes
  UNION ALL SELECT 2, 'NORMAL',   'kWh this hour',
         '2026-01-15 09:00:00', 'HVAC cycling within set points. DEMO.'
  UNION ALL SELECT 3, 'WARNING',  'kWh this hour',
         '2026-01-15 09:00:00', 'Chiller #2 efficiency below baseline. DEMO.'
  UNION ALL SELECT 4, 'NORMAL',   'kL today',
         '2026-01-15 09:05:00', 'Water flow nominal. DEMO.'
  UNION ALL SELECT 5, 'WARNING',  'C02 ppm',
         '2026-01-15 09:05:00', 'North lobby CO2 trending high. DEMO.'
  UNION ALL SELECT 6, 'CRITICAL', 'Waste bin fill %',
         '2026-01-15 09:10:00', 'Loading dock bins near capacity. DEMO.'
) d ON d.ord = b.ord;
SELECT ROW_COUNT() AS monitoring_seed_rows;
SET FOREIGN_KEY_CHECKS=1;
