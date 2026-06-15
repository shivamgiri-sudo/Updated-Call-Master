-- Phase 16 app-owned tables for Call Master Enterprise IQ
-- Use only in the approved application database. Do not run against read-only source databases.

CREATE TABLE IF NOT EXISTS cm_email_template_master (
  template_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  template_code VARCHAR(100) NOT NULL UNIQUE,
  template_name VARCHAR(200) NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  audience VARCHAR(200) NULL,
  active_status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cm_email_template_version (
  version_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT NOT NULL,
  version_no INT NOT NULL,
  subject_line VARCHAR(255) NOT NULL,
  html_body MEDIUMTEXT NOT NULL,
  text_body MEDIUMTEXT NULL,
  layout_json JSON NULL,
  approval_status ENUM('DRAFT','APPROVED','RETIRED') NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_template_version (template_id, version_no)
);

CREATE TABLE IF NOT EXISTS cm_email_event_log (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  template_code VARCHAR(100) NOT NULL,
  related_module VARCHAR(100) NOT NULL,
  related_record_id VARCHAR(100) NULL,
  recipient_json JSON NULL,
  render_status ENUM('PENDING','RENDERED','FAILED') NOT NULL DEFAULT 'PENDING',
  delivery_status ENUM('NOT_SENT','SENT','FAILED') NOT NULL DEFAULT 'NOT_SENT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cm_live_session (
  session_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  call_id BIGINT NULL,
  process_code VARCHAR(100) NOT NULL,
  agent_code VARCHAR(100) NULL,
  session_status ENUM('LIVE','COMPLETED','FAILED') NOT NULL DEFAULT 'LIVE',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS cm_live_transcript_chunk (
  chunk_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT NOT NULL,
  chunk_sequence INT NOT NULL,
  speaker VARCHAR(50) NULL,
  chunk_text TEXT NOT NULL,
  chunk_time_sec INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_live_chunk (session_id, chunk_sequence)
);

CREATE TABLE IF NOT EXISTS cm_live_assist_event (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  severity ENUM('INFO','LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'INFO',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  confidence_percent DECIMAL(5,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cm_tenant_master (
  tenant_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_code VARCHAR(80) NOT NULL UNIQUE,
  tenant_name VARCHAR(200) NOT NULL,
  region VARCHAR(80) NULL,
  active_status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cm_tenant_feature_flag (
  flag_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  feature_code VARCHAR(100) NOT NULL,
  enabled_flag TINYINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenant_feature (tenant_id, feature_code)
);

CREATE TABLE IF NOT EXISTS cm_coaching_calendar_event (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  coaching_assignment_id BIGINT NULL,
  process_code VARCHAR(100) NULL,
  employee_code VARCHAR(100) NULL,
  event_title VARCHAR(200) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  event_status ENUM('SCHEDULED','COMPLETED','MISSED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
