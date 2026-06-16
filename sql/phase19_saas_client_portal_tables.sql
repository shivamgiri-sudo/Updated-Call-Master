-- Phase 19 app-owned schema for SaaS tenant persistence and Client Portal permissions
-- Create these tables only in the approved application database.

CREATE TABLE IF NOT EXISTS cm_tenant_master (
  tenant_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_code VARCHAR(80) NOT NULL UNIQUE,
  tenant_name VARCHAR(255) NOT NULL,
  plan_name VARCHAR(120) NOT NULL,
  region_name VARCHAR(120) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  data_retention_days INT NOT NULL DEFAULT 365,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cm_tenant_feature_flag (
  feature_flag_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  feature_key VARCHAR(120) NOT NULL,
  feature_label VARCHAR(180) NOT NULL,
  enabled_flag TINYINT(1) NOT NULL DEFAULT 0,
  maturity_status VARCHAR(80) NULL,
  owner_role VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenant_feature (tenant_id, feature_key),
  KEY idx_tenant_feature_tenant (tenant_id)
);

CREATE TABLE IF NOT EXISTS cm_tenant_usage_daily (
  usage_date DATE NOT NULL,
  tenant_id BIGINT NOT NULL,
  active_users INT NOT NULL DEFAULT 0,
  total_calls INT NOT NULL DEFAULT 0,
  ai_audits INT NOT NULL DEFAULT 0,
  live_assist_sessions INT NOT NULL DEFAULT 0,
  storage_used_gb DECIMAL(12,2) NOT NULL DEFAULT 0,
  refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usage_date, tenant_id)
);

CREATE TABLE IF NOT EXISTS cm_client_portal_role (
  portal_role_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_code VARCHAR(80) NOT NULL UNIQUE,
  role_name VARCHAR(160) NOT NULL,
  role_description VARCHAR(500) NULL,
  active_flag TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cm_client_portal_user (
  portal_user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  client_id BIGINT NOT NULL,
  portal_role_id BIGINT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  display_name VARCHAR(180) NULL,
  active_flag TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_portal_user (tenant_id, client_id, user_email),
  KEY idx_portal_user_tenant_client (tenant_id, client_id)
);

CREATE TABLE IF NOT EXISTS cm_client_portal_permission (
  permission_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  portal_role_id BIGINT NOT NULL,
  module_key VARCHAR(120) NOT NULL,
  can_view_flag TINYINT(1) NOT NULL DEFAULT 0,
  can_export_flag TINYINT(1) NOT NULL DEFAULT 0,
  can_comment_flag TINYINT(1) NOT NULL DEFAULT 0,
  can_download_raw_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_module (portal_role_id, module_key)
);

CREATE TABLE IF NOT EXISTS cm_client_portal_share_log (
  share_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  client_id BIGINT NOT NULL,
  module_key VARCHAR(120) NOT NULL,
  shared_by_user_id BIGINT NULL,
  shared_to_email VARCHAR(255) NOT NULL,
  share_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_share_tenant_client (tenant_id, client_id),
  KEY idx_share_status (share_status)
);
