-- ============================================================================
-- Campus Sustainability Dashboard - SCHEMA
-- Target: MySQL / MariaDB (tested on XAMPP MariaDB 10.4.32, works on MySQL 8+)
-- Run:  mysql -u sust_app -p ... campus_sustainability < backend/schema.sql
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS monitoring_status;
DROP TABLE IF EXISTS report_sections;
DROP TABLE IF EXISTS transportation_records;
DROP TABLE IF EXISTS carbon_records;
DROP TABLE IF EXISTS waste_records;
DROP TABLE IF EXISTS water_records;
DROP TABLE IF EXISTS energy_records;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS buildings;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- USERS & ROLES
-- ============================================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  user_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username        VARCHAR(50)  NOT NULL,
  email           VARCHAR(120) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,          -- bcrypt hash only, NEVER plaintext
  full_name       VARCHAR(120) NOT NULL,
  role            ENUM('ADMIN','MANAGER','STUDENT') NOT NULL DEFAULT 'STUDENT',
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at   DATETIME     NULL DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BUILDINGS (reference table used across energy/water/monitoring/alerts)
-- ============================================================================
DROP TABLE IF EXISTS buildings;
CREATE TABLE buildings (
  building_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(120) NOT NULL,
  code            VARCHAR(20)  NOT NULL,
  campus_zone     VARCHAR(60)  NULL DEFAULT NULL,
  floor_count     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  net_area_m2     INT UNSIGNED  NULL DEFAULT NULL,
  PRIMARY KEY (building_id),
  UNIQUE KEY uq_buildings_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ENERGY
-- ============================================================================
DROP TABLE IF EXISTS energy_records;
CREATE TABLE energy_records (
  record_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  building_id     INT UNSIGNED NOT NULL,
  recorded_on     DATE         NOT NULL,
  meter_id        VARCHAR(40)  NULL DEFAULT NULL,
  total_kwh       DECIMAL(12,2) NOT NULL,
  renewable_kwh   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grid_kwh        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cost_usd        DECIMAL(12,2) NULL DEFAULT NULL,
  saving_kwh      DECIMAL(12,2) NULL DEFAULT NULL,
  recorded_by     INT UNSIGNED NULL DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_energy_building_date (building_id, recorded_on),
  KEY idx_energy_date (recorded_on),
  CONSTRAINT fk_energy_building FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE CASCADE,
  CONSTRAINT fk_energy_user FOREIGN KEY (recorded_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- WATER
-- ============================================================================
DROP TABLE IF EXISTS water_records;
CREATE TABLE water_records (
  record_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  building_id     INT UNSIGNED NOT NULL,
  recorded_on     DATE         NOT NULL,
  meter_id        VARCHAR(40)  NULL DEFAULT NULL,
  total_kL        DECIMAL(12,2) NOT NULL,
  potable_kL      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rainwater_kL    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  recycled_kL     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cost_usd        DECIMAL(12,2) NULL DEFAULT NULL,
  leak_alerts     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  recorded_by     INT UNSIGNED NULL DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_water_building_date (building_id, recorded_on),
  KEY idx_water_date (recorded_on),
  CONSTRAINT fk_water_building FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE CASCADE,
  CONSTRAINT fk_water_user FOREIGN KEY (recorded_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- WASTE
-- ============================================================================
DROP TABLE IF EXISTS waste_records;
CREATE TABLE waste_records (
  record_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  building_id     INT UNSIGNED NOT NULL,
  recorded_on     DATE         NOT NULL,
  waste_type      ENUM('RECYCLABLE','ORGANIC','GENERAL','HAZARDOUS','E_WASTE') NOT NULL DEFAULT 'GENERAL',
  amount_kg       DECIMAL(12,2) NOT NULL,
  diverted_kg     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  hauler          VARCHAR(100) NULL DEFAULT NULL,
  service_fee_usd DECIMAL(12,2) NULL DEFAULT NULL,
  recorded_by     INT UNSIGNED NULL DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_waste_building_date (building_id, recorded_on),
  KEY idx_waste_type (waste_type),
  CONSTRAINT fk_waste_building FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE CASCADE,
  CONSTRAINT fk_waste_user FOREIGN KEY (recorded_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CARBON / GREENHOUSE GAS
-- ============================================================================
DROP TABLE IF EXISTS carbon_records;
CREATE TABLE carbon_records (
  record_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  building_id     INT UNSIGNED NULL DEFAULT NULL,
  recorded_on     DATE         NOT NULL,
  scope           ENUM('SCOPE1','SCOPE2','SCOPE3') NOT NULL DEFAULT 'SCOPE2',
  source_name     VARCHAR(100) NOT NULL,
  co2e_tons       DECIMAL(12,3) NOT NULL,
  baseline_tons   DECIMAL(12,3) NULL DEFAULT NULL,
  reduction_tons  DECIMAL(12,3) NULL DEFAULT NULL,
  recorded_by     INT UNSIGNED NULL DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_carbon_date (recorded_on),
  KEY idx_carbon_scope (scope),
  CONSTRAINT fk_carbon_building FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE SET NULL,
  CONSTRAINT fk_carbon_user FOREIGN KEY (recorded_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TRANSPORTATION
-- ============================================================================
DROP TABLE IF EXISTS transportation_records;
CREATE TABLE transportation_records (
  record_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recorded_on     DATE         NOT NULL,
  mode            ENUM('BUS','SHUTTLE','BIKE','WALK','CARPOOL','EV_HYBRID','SINGLE_OCCUPANCY_VEHICLE') NOT NULL,
  trips_count     INT UNSIGNED  NOT NULL DEFAULT 0,
  avg_trip_km     DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
  emissions_tons  DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  passes_sold     INT UNSIGNED  NULL DEFAULT NULL,
  cost_usd        DECIMAL(12,2) NULL DEFAULT NULL,
  recorded_by     INT UNSIGNED NULL DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_transport_date (recorded_on),
  KEY idx_transport_mode (mode),
  CONSTRAINT fk_transport_user FOREIGN KEY (recorded_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MONITORING STATUS
-- NOTE: represents monitoring STATUS of each building driven by stored app
-- data (e.g. its latest energy/water records). This is NOT a claim of live
-- sensor integration -- no hardware is connected.
-- ============================================================================
DROP TABLE IF EXISTS monitoring_status;
CREATE TABLE monitoring_status (
  status_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  building_id     INT UNSIGNED NOT NULL,
  status          ENUM('NORMAL','WARNING','CRITICAL','OFFLINE') NOT NULL DEFAULT 'NORMAL',
  current_metric  VARCHAR(120) NULL DEFAULT NULL,
  last_reading_at DATETIME     NULL DEFAULT NULL,
  checked_by      INT UNSIGNED NULL DEFAULT NULL,
  notes           VARCHAR(255) NULL DEFAULT NULL,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (status_id),
  UNIQUE KEY uq_monitoring_building (building_id),
  CONSTRAINT fk_monitoring_building FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE CASCADE,
  CONSTRAINT fk_monitoring_user FOREIGN KEY (checked_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ALERTS
-- ============================================================================
DROP TABLE IF EXISTS alerts;
CREATE TABLE alerts (
  alert_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  severity        ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
  category        ENUM('ENERGY','WATER','WASTE','CARBON','TRANSPORTATION','MONITORING','SYSTEM') NOT NULL DEFAULT 'ENERGY',
  status          ENUM('OPEN','IN_REVIEW','ACKNOWLEDGED','RESOLVED','DISMISSED') NOT NULL DEFAULT 'OPEN',
  title           VARCHAR(160) NOT NULL,
  detail          TEXT         NULL DEFAULT NULL,
  building_id     INT UNSIGNED NULL DEFAULT NULL,
  created_by      INT UNSIGNED NULL DEFAULT NULL,
  resolved_by     INT UNSIGNED NULL DEFAULT NULL,
  resolved_at     DATETIME     NULL DEFAULT NULL,
  resolution_note VARCHAR(255) NULL DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (alert_id),
  KEY idx_alerts_severity (severity),
  KEY idx_alerts_status (status),
  KEY idx_alerts_category (category),
  KEY idx_alerts_created (created_at),
  CONSTRAINT fk_alerts_building FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE SET NULL,
  CONSTRAINT fk_alerts_creator FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT fk_alerts_resolver FOREIGN KEY (resolved_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- REPORT SECTIONS (contents assembled from live metrics via the Reports API;
-- the table stores per-period section metadata/attribution)
-- ============================================================================
DROP TABLE IF EXISTS report_sections;
CREATE TABLE report_sections (
  section_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  period_key      VARCHAR(20)  NOT NULL,          -- e.g. '2026-Q3'
  section_order   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  machine_heading VARCHAR(160) NOT NULL,
  report_label    VARCHAR(160) NULL DEFAULT NULL,
  PRIMARY KEY (section_id),
  KEY idx_rs_period (period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ACTIVITY LOGS (audit trail: who did what & when)
-- ============================================================================
DROP TABLE IF EXISTS activity_logs;
CREATE TABLE activity_logs (
  log_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NULL DEFAULT NULL,
  action       VARCHAR(60)  NOT NULL,             -- e.g. 'auth.login', 'energy.create'
  entity_type  VARCHAR(40)  NULL DEFAULT NULL,
  entity_id    VARCHAR(40)  NULL DEFAULT NULL,
  detail       VARCHAR(255) NULL DEFAULT NULL,
  ip           VARCHAR(45)  NULL DEFAULT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_logs_user (user_id),
  KEY idx_logs_action (action),
  KEY idx_logs_created (created_at),
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
