-- =====================================================
-- Executive Dashboard MVP - Portal Audit Table
-- =====================================================
-- Event log for all portal actions (VIEW, EXPORT, etc.)
-- Supports compliance, security audits, and watermarking
-- =====================================================

-- Create portal audit table
CREATE TABLE IF NOT EXISTS cm_portal_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- Who
  user_id INT NOT NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- What
  event_type ENUM('VIEW', 'EXPORT', 'EDIT', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
  resource_type VARCHAR(50) NOT NULL COMMENT 'CALL, DASHBOARD, REPORT, USER',
  resource_id VARCHAR(255) COMMENT 'ID of the resource accessed',

  -- How
  request_path VARCHAR(500),
  request_method VARCHAR(10),
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Export-specific
  watermark_applied BOOLEAN DEFAULT FALSE,
  export_format VARCHAR(20) COMMENT 'PDF, CSV, XLSX',
  row_count INT COMMENT 'Number of records exported',

  -- When
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user (user_id),
  INDEX idx_event (event_type),
  INDEX idx_created (created_at),
  INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
