-- =====================================================
-- Executive Dashboard MVP - Executive Summary Table
-- =====================================================
-- Pre-aggregated metrics cache for executive dashboard
-- Refreshed daily via cron at 2 AM
-- Current day TTL: 5 minutes, historical days: 24 hours
-- =====================================================

-- Create executive summary table
CREATE TABLE IF NOT EXISTS cm_executive_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Dimensions
  snapshot_date DATE NOT NULL,
  process_code VARCHAR(50) NOT NULL,
  branch_code VARCHAR(50),
  client_id INT NOT NULL,

  -- Call volume
  total_calls INT DEFAULT 0,
  inbound_calls INT DEFAULT 0,
  outbound_calls INT DEFAULT 0,
  connected_calls INT DEFAULT 0,

  -- Outcomes
  conversion_count INT DEFAULT 0,
  rejection_count INT DEFAULT 0,

  -- Averages
  avg_talk_time_seconds DECIMAL(10,2),
  avg_hold_time_seconds DECIMAL(10,2),
  avg_conversion_rate DECIMAL(5,2),
  avg_qa_score DECIMAL(5,2),

  -- Revenue (if available)
  total_revenue DECIMAL(15,2),

  -- Risk flags
  critical_errors_count INT DEFAULT 0,
  compliance_violations_count INT DEFAULT 0,

  -- Metadata
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY idx_snapshot (snapshot_date, process_code, branch_code, client_id),
  INDEX idx_date (snapshot_date),
  INDEX idx_process (process_code),
  INDEX idx_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Seed Data: Sample Executive Metrics
-- =====================================================

INSERT INTO cm_executive_summary
(snapshot_date, process_code, branch_code, client_id, total_calls, inbound_calls, outbound_calls, connected_calls, conversion_count, rejection_count, avg_talk_time_seconds, avg_conversion_rate, avg_qa_score, total_revenue)
VALUES
('2026-06-19', 'FINNABLE', 'MUMBAI', 1, 450, 180, 270, 412, 56, 98, 385.5, 12.4, 78.3, 258000),
('2026-06-19', 'FINNABLE', 'DELHI', 1, 380, 150, 230, 348, 42, 82, 372.0, 11.1, 75.8, 210000),
('2026-06-19', 'INDIFI', 'MUMBAI', 1, 320, 120, 200, 295, 38, 68, 390.2, 11.9, 80.5, 185000);
