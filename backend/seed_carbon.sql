-- ============================================================
-- Campus Sustainability Dashboard - CARBON SEED (DEMO data)
-- Synthetic 12-month scope-1/2/3 baselines per building (72 rows).
-- NOT live inventory data; clearly labelled DEMO.
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
SET @adm = (SELECT user_id FROM users WHERE username='adm.campus' LIMIT 1);
INSERT INTO carbon_records
  (building_id, recorded_on, scope, source_name, co2e_tons,
   baseline_tons, reduction_tons, recorded_by)
SELECT b.building_id,
       d.recorded_on,
       d.scope,
       d.source_name,
       d.co2e_tons,
       d.baseline_tons,
       ROUND(d.baseline_tons - d.co2e_tons, 3),
       @adm
FROM buildings b
JOIN (
  SELECT '2025-07-01' AS recorded_on, 'SCOPE1' AS scope, 'Natural gas heating' AS source_name, 182.4 AS co2e_tons, 204.0 AS baseline_tons
  UNION ALL SELECT '2025-07-01', 'SCOPE2', 'Purchased electricity', 305.6, 350.0
  UNION ALL SELECT '2025-07-01', 'SCOPE3', 'Staff commuting', 76.2, 88.0
  UNION ALL SELECT '2025-08-01', 'SCOPE1', 'Natural gas heating', 174.1, 200.0
  UNION ALL SELECT '2025-08-01', 'SCOPE2', 'Purchased electricity', 298.3, 345.0
  UNION ALL SELECT '2025-08-01', 'SCOPE3', 'Staff commuting', 73.8, 86.0
  UNION ALL SELECT '2025-09-01', 'SCOPE1', 'Natural gas heating', 169.5, 198.0
  UNION ALL SELECT '2025-09-01', 'SCOPE2', 'Purchased electricity', 282.1, 340.0
  UNION ALL SELECT '2025-09-01', 'SCOPE3', 'Staff commuting', 70.4, 84.0
  UNION ALL SELECT '2025-10-01', 'SCOPE1', 'Natural gas heating', 181.0, 205.0
  UNION ALL SELECT '2025-10-01', 'SCOPE2', 'Purchased electricity', 296.5, 348.0
  UNION ALL SELECT '2025-10-01', 'SCOPE3', 'Staff commuting', 75.1, 87.0
  UNION ALL SELECT '2025-11-01', 'SCOPE1', 'Natural gas heating', 195.8, 215.0
  UNION ALL SELECT '2025-11-01', 'SCOPE2', 'Purchased electricity', 320.4, 360.0
  UNION ALL SELECT '2025-11-01', 'SCOPE3', 'Staff commuting', 82.7, 92.0
  UNION ALL SELECT '2025-12-01', 'SCOPE1', 'Natural gas heating', 210.2, 235.0
  UNION ALL SELECT '2025-12-01', 'SCOPE2', 'Purchased electricity', 335.8, 375.0
  UNION ALL SELECT '2025-12-01', 'SCOPE3', 'Staff commuting', 88.4, 98.0
  UNION ALL SELECT '2026-01-01', 'SCOPE1', 'Natural gas heating', 221.6, 245.0
  UNION ALL SELECT '2026-01-01', 'SCOPE2', 'Purchased electricity', 345.2, 385.0
  UNION ALL SELECT '2026-01-01', 'SCOPE3', 'Staff commuting', 92.1, 101.0
) d ON 1=1;
SELECT ROW_COUNT() AS carbon_seed_rows;
SET FOREIGN_KEY_CHECKS=1;
