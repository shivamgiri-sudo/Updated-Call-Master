-- Phase 20 app-owned schema for Client Portal hardening and tenant usage aggregation
-- Create only in the approved application database.

CREATE TABLE IF NOT EXISTS cm_tenant_usage_aggregation_log (
  aggregation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  usage_date DATE NOT NULL,
  aggregation_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  total_calls INT NOT NULL DEFAULT 0,
  ai_audits INT NOT NULL DEFAULT 0,
  live_assist_sessions INT NOT NULL DEFAULT 0,
  active_users INT NOT NULL DEFAULT 0,
  error_message VARCHAR(1000) NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usage_aggregation (tenant_id, usage_date)
);

CREATE TABLE IF NOT EXISTS cm_client_portal_share_approval (
  approval_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  share_log_id BIGINT NOT NULL,
  requested_by_user_id BIGINT NULL,
  approval_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_APPROVAL',
  risk_level VARCHAR(40) NOT NULL DEFAULT 'LOW',
  approver_user_id BIGINT NULL,
  approver_comment VARCHAR(1000) NULL,
  approved_at DATETIME NULL,
  rejected_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_share_approval_status (approval_status),
  KEY idx_share_approval_share (share_log_id)
);

CREATE TABLE IF NOT EXISTS cm_export_watermark_policy (
  watermark_policy_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  export_type VARCHAR(80) NOT NULL,
  watermark_template VARCHAR(1000) NOT NULL,
  enabled_flag TINYINT(1) NOT NULL DEFAULT 1,
  raw_download_allowed_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_watermark_tenant_export (tenant_id, export_type)
);

CREATE TABLE IF NOT EXISTS cm_client_portal_access_audit (
  access_audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  client_id BIGINT NOT NULL,
  portal_user_id BIGINT NULL,
  event_type VARCHAR(80) NOT NULL,
  module_key VARCHAR(120) NOT NULL,
  access_status VARCHAR(40) NOT NULL,
  ip_address VARCHAR(80) NULL,
  user_agent VARCHAR(500) NULL,
  watermark_applied_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_portal_audit_tenant_client (tenant_id, client_id),
  KEY idx_portal_audit_event (event_type, access_status),
  KEY idx_portal_audit_created (created_at)
);

CREATE TABLE IF NOT EXISTS cm_sso_mfa_config (
  config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  provider_type VARCHAR(80) NOT NULL,
  provider_name VARCHAR(160) NOT NULL,
  sso_enabled_flag TINYINT(1) NOT NULL DEFAULT 0,
  mfa_required_flag TINYINT(1) NOT NULL DEFAULT 1,
  admin_mfa_required_flag TINYINT(1) NOT NULL DEFAULT 1,
  client_mfa_required_flag TINYINT(1) NOT NULL DEFAULT 1,
  session_timeout_minutes INT NOT NULL DEFAULT 30,
  callback_url VARCHAR(500) NULL,
  metadata_url VARCHAR(500) NULL,
  active_flag TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sso_config_tenant_provider (tenant_id, provider_type, provider_name)
);
