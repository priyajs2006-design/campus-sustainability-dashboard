-- ============================================================================
-- Campus Sustainability Dashboard - SEED SCRIPT
-- ============================================================================
-- IMPORTANT: this file contains ONLY clearly-labelled SAMPLE / DEMO data so
-- every page, chart, report, alert and the monitoring board show meaningful
-- values during development and testing. It is NOT live sensor data, NOT real
-- utility bills, and NOT a claim of hardware integration.
--
-- The samples give trend lines across Q3 2025 -> Q2 2026 so charts (energy,
-- water, waste, carbon, transportation) and the monitoring/alerts/reports
-- pages always have something real (but synthetic) to display.
--
-- Destructive on purpose: DROP/CREATE the data tables, then INSERT sets.
-- You must run backend/schema.sql FIRST (it creates empty tables).
--
--   mysql -u sust_app -p -h 127.0.0.1 campus_sustainability < backend/seed.sql
--
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1) BUILDINGS (same set as the frontend demo)
-- ============================================================================
SET @lib_id   = NULL; SET @sci_id = NULL; SET @admin_id = NULL; SET @stud_id = NULL;
SET @gym_id   = NULL; SET @caf_id  = NULL;

INSERT INTO buildings (name, code, campus_zone, floor_count, net_area_m2)
VALUES
  ('Central Library',   'LIB', 'Academic Core', 5, 12500),
  ('Science Center',    'SCI', 'Academic Core', 3,  8200),
  ('Administration',    'ADM', 'Administrative', 2,  5400),
  ('Student Union',     'STU', 'Student Life',  3,  9100),
  ('Recreation Center', 'REC', 'Student Life',  2,  6800),
  ('Campus Dining Hall','DIN', 'Student Life',  2,  4600);

SET @lib_id   = LAST_INSERT_ID();
SET @sci_id   = @lib_id + 1;
SET @admin_id = @lib_id + 2;
SET @stud_id  = @lib_id + 3;
SET @gym_id   = @lib_id + 4;
SET @caf_id   = @lib_id + 5;

-- ============================================================================
-- 2) USERS  (DEV/DEMO accounts)
--    Passwords are hashed by the backend (bcrypt) on first run; the seeds
--    below are PLACEHOLDER-LOOKING strings so this file stays portable.
--    The backend "bootstrap" step overwrites these with real bcrypt hashes.
--    NEVER put real passwords in source.
-- ============================================================================
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES
  ('admin.sust',  'admin@campus.edu', ':PLACEHOLDER-SEED-', 'Priya Aurora',     'ADMIN',   1),
  ('mgr.energy',  'mgr.energy@campus.edu', ':PLACEHOLDER-SEED-', 'Dana Kline', 'MANAGER', 1),
  ('sust.student','student@campus.edu', ':PLACEHOLDER-SEED-', 'Chris Osei',     'STUDENT', 1);

-- capture ids for FK usage later
SET @admin_user = (SELECT user_id FROM users WHERE username = 'admin.sust' LIMIT 1);
SET @mgr_user   = (SELECT user_id FROM users WHERE username = 'mgr.energy' LIMIT 1);
SET @stu_user   = (SELECT user_id FROM users WHERE username = 'sust.student' LIMIT 1);

-- ============================================================================
-- 3) ENERGY  (8 quarters, 6 buildings -> 48 rows; kW h + cost + savings)
-- ============================================================================
INSERT INTO energy_records (building_id, recorded_on, meter_id, total_kwh, renewable_kwh, grid_kwh, cost_usd, saving_kwh)
SELECT b.building_id, d.recorded_on,
       CONCAT(b.code, '-', DATE_FORMAT(d.recorded_on,'%Y%m')),
       ROUND(40000 + RAND()*32000, 2) * (1 + 0.02*d.qoff),
       ROUND(9000  + RAND()*9000,  2),
       ROUND(30000 + RAND()*25000,  2),
       ROUND((40000 + RAND()*32000) * 0.115 * (1 + 0.03*d.qoff), 2),
       ROUND(3000  + RAND()*4000,  2)
FROM buildings b
JOIN (SELECT '2025-07-01' recorded_on, 0 qoff UNION ALL SELECT '2025-08-01',0 UNION ALL SELECT '2025-09-01',0
      UNION ALL SELECT '2025-10-01',1 UNION ALL SELECT '2025-11-01',1 UNION ALL SELECT '2025-12-01',1
      UNION ALL SELECT '2026-01-01',2 UNION ALL SELECT '2026-02-01',2 UNION ALL SELECT '2026-03-01',2
      UNION ALL SELECT '2026-04-01',3 UNION ALL SELECT '2026-05-01',3 UNION ALL SELECT '2026-06-01',3
     ) d ON 1=1;
-- sanity: count
SELECT COUNT(*) AS energy_seed_rows FROM energy_records;
