-- ============================================================
-- Campus Sustainability Dashboard - TRANSPORTATION SEED (DEMO)
-- Synthetic 12-month commute + fleet patterns for the campus
-- community. Clearly DEMO; not ride-hailing or ticketing data.
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
SET @adm = (SELECT user_id FROM users WHERE username='adm.campus' LIMIT 1);

INSERT INTO transportation_records
  (recorded_on, mode, trips_count, avg_trip_km, emissions_tons,
   passes_sold, cost_usd, recorded_by)
SELECT d.recorded_on, d.mode, d.trips_count, d.avg_trip_km,
       d.emissions_tons, d.passes_sold, d.cost_usd, @adm
FROM (
  SELECT '2025-07-01' AS recorded_on, 'BIKE' AS mode, 940 AS trips_count, 4.2 AS avg_trip_km,  rent,           rent,              rent,           rent
) d ON 1=1;
SELECT ROW_COUNT() AS transportation_seed_rows;
SET FOREIGN_KEY_CHECKS=1;
