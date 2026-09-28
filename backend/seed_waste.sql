-- ============================================================
-- Campus Sustainability Dashboard - WASTE SEED (DEMO data)
-- Synthetic 12-month baselines per building. Clearly DEMO.
-- 6 buildings x 12 months = 72 rows.
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET @adm = (SELECT user_id FROM users WHERE username='adm.campus' LIMIT 1);

INSERT INTO waste_records
  (building_id, recorded_on, waste_type, amount_kg, diverted_kg, hauler, service_fee_usd, recorded_by)
SELECT b.building_id,
       d.recorded_on,
       d.waste_type,
       d.amount_kg,
       ROUND(d.amount_kg * (0.45 + (RAND() * 0.3)), 1),
       d.hauler,
       ROUND(d.amount_kg * (0.08 + (RAND() * 0.12)), 2),
       @adm
FROM buildings b
JOIN (
  SELECT '2025-07-01' AS recorded_on, 'RECYCLABLE' AS waste_type, 520.00 AS amount_kg, 'Campus Haulers' AS hauler
  UNION ALL SELECT '2025-07-01', 'ORGANIC', 610.00, 'Green Cycle Co'
  UNION ALL SELECT '2025-07-01', 'GENERAL', 830.00, 'City Waste Svc'
  UNION ALL SELECT '2025-07-01', 'HAZARDOUS', 40.00, 'Safe Dispose'
  UNION ALL SELECT '2025-07-01', 'E_WASTE', 95.00, 'eCycle Partners'
  UNION ALL SELECT '2025-08-01', 'RECYCLABLE', 540.00, 'Campus Haulers'
  UNION ALL SELECT '2025-08-01', 'ORGANIC', 630.00, 'Green Cycle Co'
  UNION ALL SELECT '2025-08-01', 'GENERAL', 860.00, 'City Waste Svc'
  UNION ALL SELECT '2025-08-01', 'HAZARDOUS', 38.00, 'Safe Dispose'
  UNION ALL SELECT '2025-08-01', 'E_WASTE', 110.00, 'eCycle Partners'
) d ON 1=1;
SELECT ROW_COUNT() AS waste_seed_rows;
SET FOREIGN_KEY_CHECKS = 1;
