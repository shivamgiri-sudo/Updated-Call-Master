-- Phase 10: Metric Definition Catalog
-- Purpose: Track all legacy dashboard metrics for parity monitoring

USE Shivamgiri;

CREATE TABLE IF NOT EXISTS cm_metric_definition (
  metric_id INT AUTO_INCREMENT PRIMARY KEY,
  dashboard_type ENUM('INBOUND', 'OUTBOUND', 'BOTH') NOT NULL,
  page_name VARCHAR(100) NOT NULL COMMENT 'Page/section where metric appears',
  widget_name VARCHAR(100) NOT NULL COMMENT 'Widget/card name',
  metric_code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique metric identifier',
  metric_name VARCHAR(200) NOT NULL COMMENT 'Display name',
  process_type ENUM('INBOUND', 'OUTBOUND', 'BOTH') NULL COMMENT 'Applicable to which process type',
  source_db VARCHAR(50) NULL COMMENT 'Source database: Shivamgiri, db_external, db_audit',
  source_table VARCHAR(100) NULL COMMENT 'Primary source table',
  source_columns TEXT NULL COMMENT 'Comma-separated list of source columns',
  formula_sql TEXT NULL COMMENT 'SQL formula/query for metric calculation',
  filter_fields TEXT NULL COMMENT 'JSON: available filter fields',
  drilldown_route VARCHAR(200) NULL COMMENT 'Frontend route for drill-down',
  role_visibility TEXT NULL COMMENT 'Comma-separated roles: Admin,T&Q Head,QA Auditor,etc',
  status ENUM('IMPLEMENTED', 'NEEDS_FORMULA', 'SOURCE_MAPPED', 'SOURCE_MISSING', 'PARTIAL') NOT NULL DEFAULT 'SOURCE_MISSING',
  notes TEXT NULL COMMENT 'Implementation notes, business logic clarifications',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dashboard_type (dashboard_type),
  INDEX idx_metric_code (metric_code),
  INDEX idx_status (status),
  INDEX idx_process_type (process_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Metric catalog for legacy dashboard parity tracking';

-- Insert Inbound Metrics (Implemented in Phase 7)
INSERT INTO cm_metric_definition (dashboard_type, page_name, widget_name, metric_code, metric_name, process_type, source_db, source_table, source_columns, formula_sql, filter_fields, drilldown_route, role_visibility, status, notes) VALUES
('INBOUND', 'Inbound Quality', 'KPI Card', 'INBOUND_TOTAL_AUDITS', 'Total Audits', 'INBOUND', 'db_audit', 'call_quality_assessment', 'id', 'SELECT COUNT(*) as audit_count FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', '/inbound-quality', 'T&Q Head,QA Auditor,Admin', 'IMPLEMENTED', 'Phase 7 - API: GET /api/inbound/:processCode/quality'),

('INBOUND', 'Inbound Quality', 'KPI Card', 'INBOUND_CQ_SCORE', 'CQ Score', 'INBOUND', 'db_audit', 'call_quality_assessment', 'cq_score', 'SELECT AVG(cq_score) as cq_score FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', '/inbound-quality', 'T&Q Head,QA Auditor,Admin', 'IMPLEMENTED', 'Phase 7 - API: GET /api/inbound/:processCode/quality'),

('INBOUND', 'Inbound Quality', 'KPI Card', 'INBOUND_SENSITIVE_WORD_COUNT', 'Sensitive Word Count', 'INBOUND', 'db_audit', 'call_quality_assessment', 'sensitive_word_count', 'SELECT SUM(sensitive_word_count) as sensitive_word_count FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', '/inbound-quality', 'T&Q Head,QA Auditor,Admin', 'IMPLEMENTED', 'Phase 7 - API: GET /api/inbound/:processCode/quality'),

('INBOUND', 'Inbound Quality', 'KPI Card', 'INBOUND_POLICY_FAILURE_COUNT', 'Policy Failure Count', 'INBOUND', 'db_audit', 'call_quality_assessment', 'policy_failure_count', 'SELECT SUM(policy_failure_count) as policy_failure_count FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', '/inbound-quality', 'T&Q Head,QA Auditor,Admin', 'IMPLEMENTED', 'Phase 7 - API: GET /api/inbound/:processCode/quality'),

('INBOUND', 'Inbound Quality', 'Calculated', 'INBOUND_TARGET_CQ', 'Target CQ', 'INBOUND', 'Shivamgiri', 'ci_process_master', 'target_cq', 'SELECT target_cq FROM Shivamgiri.ci_process_master WHERE process_code = ?', '{"filters":["process_code"]}', '/inbound-quality', 'T&Q Head,QA Auditor,Admin', 'SOURCE_MISSING', 'target_cq column does not exist in ci_process_master - needs to be added or configured elsewhere'),

('INBOUND', 'Inbound Quality', 'Calculated', 'INBOUND_FATAL_PERCENT', 'Fatal %', 'INBOUND', 'db_audit', 'call_quality_assessment', 'fatal_count', 'SELECT (SUM(fatal_count) / COUNT(*)) * 100 as fatal_percent FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', '/inbound-quality', 'T&Q Head,QA Auditor,Admin', 'SOURCE_MAPPED', 'Data available, formula ready, pending UI display');

-- Insert more Inbound metrics (SOURCE_MAPPED)
INSERT INTO cm_metric_definition (dashboard_type, page_name, widget_name, metric_code, metric_name, process_type, source_db, source_table, source_columns, formula_sql, filter_fields, role_visibility, status, notes) VALUES
('INBOUND', 'Quality Scoring', 'Score Card', 'INBOUND_OPENING_SCORE', 'Opening Score', 'INBOUND', 'db_audit', 'call_quality_assessment', 'opening_score', 'SELECT AVG(opening_score) as opening_score FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', 'T&Q Head,QA Auditor,Admin', 'SOURCE_MAPPED', 'Column exists in db_audit schema'),

('INBOUND', 'Quality Scoring', 'Score Card', 'INBOUND_SOFT_SKILL_SCORE', 'Soft Skill Score', 'INBOUND', 'db_audit', 'call_quality_assessment', 'soft_skill_score', 'SELECT AVG(soft_skill_score) as soft_skill_score FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', 'T&Q Head,QA Auditor,Admin', 'SOURCE_MAPPED', 'Column exists in db_audit schema'),

('INBOUND', 'Quality Scoring', 'Score Card', 'INBOUND_HOLD_PROCEDURE_SCORE', 'Hold Procedure Score', 'INBOUND', 'db_audit', 'call_quality_assessment', 'hold_procedure_score', 'SELECT AVG(hold_procedure_score) as hold_procedure_score FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', 'T&Q Head,QA Auditor,Admin', 'SOURCE_MAPPED', 'Column exists in db_audit schema'),

('INBOUND', 'Quality Scoring', 'Score Card', 'INBOUND_RESOLUTION_SCORE', 'Resolution Score', 'INBOUND', 'db_audit', 'call_quality_assessment', 'resolution_score', 'SELECT AVG(resolution_score) as resolution_score FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', 'T&Q Head,QA Auditor,Admin', 'SOURCE_MAPPED', 'Column exists in db_audit schema'),

('INBOUND', 'Quality Scoring', 'Score Card', 'INBOUND_CLOSING_SCORE', 'Closing Score', 'INBOUND', 'db_audit', 'call_quality_assessment', 'closing_score', 'SELECT AVG(closing_score) as closing_score FROM db_audit.call_quality_assessment WHERE process_code = ?', '{"filters":["process_code","date_range"]}', 'T&Q Head,QA Auditor,Admin', 'SOURCE_MAPPED', 'Column exists in db_audit schema');

-- Insert Outbound Metrics (Implemented in Phase 4)
INSERT INTO cm_metric_definition (dashboard_type, page_name, widget_name, metric_code, metric_name, process_type, source_db, source_table, source_columns, formula_sql, filter_fields, drilldown_route, role_visibility, status, notes) VALUES
('OUTBOUND', 'Outbound Funnel', 'Funnel Metrics', 'OUTBOUND_CST_TOTAL_CALLS', 'CST Total Calls', 'OUTBOUND', 'db_external', 'CallDetails', 'id', 'SELECT COUNT(*) as total_calls FROM db_external.CallDetails WHERE ProcessCode = ?', '{"filters":["ProcessCode","CallDate"]}', '/outbound-funnel', 'T&Q Head,CEO,Ops Manager,TL,Admin', 'IMPLEMENTED', 'Phase 4 - API: GET /api/outbound/:processCode/funnel'),

('OUTBOUND', 'Outbound Funnel', 'Funnel Metrics', 'OUTBOUND_CST_OFFER_SUCCESS', 'CST Offer Success', 'OUTBOUND', 'db_external', 'CallDetails', 'Offered', 'SELECT COUNT(*) as offered_count FROM db_external.CallDetails WHERE ProcessCode = ? AND Offered = "YES"', '{"filters":["ProcessCode","CallDate"]}', '/outbound-funnel', 'T&Q Head,CEO,Ops Manager,TL,Admin', 'IMPLEMENTED', 'Phase 4 - API: GET /api/outbound/:processCode/funnel'),

('OUTBOUND', 'Outbound Funnel', 'Funnel Metrics', 'OUTBOUND_CST_SALE_DONE', 'CST Sale Done', 'OUTBOUND', 'db_external', 'CallDetails', 'SaleDone', 'SELECT COUNT(*) as sale_done_count FROM db_external.CallDetails WHERE ProcessCode = ? AND SaleDone = "YES"', '{"filters":["ProcessCode","CallDate"]}', '/outbound-funnel', 'T&Q Head,CEO,Ops Manager,TL,Admin', 'IMPLEMENTED', 'Phase 4 - API: GET /api/outbound/:processCode/funnel'),

('OUTBOUND', 'Outbound Funnel', 'Calculated', 'OUTBOUND_CST_SUCCESS_RATE', 'CST Success Rate', 'OUTBOUND', 'db_external', 'CallDetails', 'SaleDone', 'SELECT (COUNT(CASE WHEN SaleDone="YES" THEN 1 END) / COUNT(*)) * 100 as conversion_percent FROM db_external.CallDetails WHERE ProcessCode = ?', '{"filters":["ProcessCode","CallDate"]}', '/outbound-funnel', 'T&Q Head,CEO,Ops Manager,TL,Admin', 'IMPLEMENTED', 'Phase 4 - Conversion % displayed'),

('OUTBOUND', 'Outbound Funnel', 'Table', 'OUTBOUND_OBJECTION_ANALYSIS', 'Customer Objection Analysis', 'OUTBOUND', 'db_external', 'CallDetails', 'CustomerObjectionCategory', 'SELECT CustomerObjectionCategory, COUNT(*) as total_calls, (SUM(CASE WHEN SaleDone="YES" THEN 1 ELSE 0 END) / COUNT(*)) * 100 as conversion_percent FROM db_external.CallDetails WHERE ProcessCode = ? GROUP BY CustomerObjectionCategory ORDER BY total_calls DESC', '{"filters":["ProcessCode","CallDate"]}', '/outbound-funnel', 'T&Q Head,CEO,Ops Manager,TL,Admin', 'IMPLEMENTED', 'Phase 4 - API: GET /api/outbound/:processCode/objections'),

('OUTBOUND', 'Outbound Funnel', 'Export', 'OUTBOUND_RAW_EXPLORER', 'Raw Download / Raw Explorer', 'OUTBOUND', 'db_external', 'CallDetails', 'ALL', 'SELECT * FROM db_external.CallDetails WHERE ProcessCode = ?', '{"filters":["ProcessCode","CallDate"]}', '/outbound-funnel', 'T&Q Head,CEO,Ops Manager,TL,Admin', 'IMPLEMENTED', 'Phase 4 - API: GET /api/export/calls?processCode=X'),

('OUTBOUND', 'Call Audit 360', 'Modal', 'OUTBOUND_AUDIT_360_FIELDS', 'Outbound Call Audit 360 Fields', 'OUTBOUND', 'db_external', 'CallDetails', 'Opening,Offered,SaleDone,ProductOffering,DiscountType,CustomerObjectionCategory', NULL, '{"filters":["ProcessCode"]}', '/audit360', 'T&Q Head,QA Auditor,Trainer,TL,Admin', 'IMPLEMENTED', 'Phase 3 - API: GET /api/calls/:callId/audit360 - Outbound Sales Fields section');

-- Insert Outbound metrics needing formula confirmation
INSERT INTO cm_metric_definition (dashboard_type, page_name, widget_name, metric_code, metric_name, process_type, source_db, source_table, source_columns, role_visibility, status, notes) VALUES
('OUTBOUND', 'Outbound Funnel', 'CST Metrics', 'OUTBOUND_CST_OPS', 'CST OPS (Opening Success)', 'OUTBOUND', 'db_external', 'CallDetails', 'Opening', 'T&Q Head,CEO,Ops Manager,TL,Admin', 'NEEDS_FORMULA', 'Unclear if OPS = COUNT(Opening="YES") or different calculation. Needs business confirmation.'),

('OUTBOUND', 'Outbound Funnel', 'CST Metrics', 'OUTBOUND_CST_CPS', 'CST CPS (Call Processing Success)', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,TL,Admin', 'NEEDS_FORMULA', 'CPS definition unclear. Needs business confirmation.'),

('OUTBOUND', 'Outbound Funnel', 'CRT Metrics', 'OUTBOUND_CRT_OR', 'CRT OR (Outbound Rate)', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,TL,Admin', 'NEEDS_FORMULA', 'CRT metrics definition unclear. Needs business confirmation on what CRT (Call Right Time?) means and how OR is calculated.'),

('OUTBOUND', 'Outbound Funnel', 'CRT Metrics', 'OUTBOUND_CRT_CR', 'CRT CR (Conversion Rate)', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,TL,Admin', 'NEEDS_FORMULA', 'CRT CR formula needs confirmation.'),

('OUTBOUND', 'Outbound Funnel', 'CRT Metrics', 'OUTBOUND_CRT_OPR', 'CRT OPR (Offer Performance Rate)', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,TL,Admin', 'NEEDS_FORMULA', 'CRT OPR formula needs confirmation.'),

('OUTBOUND', 'Outbound Funnel', 'CRT Metrics', 'OUTBOUND_CRT_POR', 'CRT POR (Performance Outcome Rate)', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,TL,Admin', 'NEEDS_FORMULA', 'CRT POR formula needs confirmation.'),

('OUTBOUND', 'Opportunity Analysis', 'Metrics', 'OUTBOUND_TOTAL_OPPORTUNITIES', 'Total Opportunities', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,TL,Admin', 'NEEDS_FORMULA', 'Definition of "opportunity" unclear (Opening done? Offered? Contact made?). Needs business confirmation.'),

('OUTBOUND', 'Opportunity Analysis', 'Metrics', 'OUTBOUND_MISSED_OPPORTUNITY_COUNT', 'Missed Opportunity Count', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,TL,Admin', 'NEEDS_FORMULA', 'Depends on Total Opportunities definition. Needs business confirmation.'),

('OUTBOUND', 'Satisfaction Metrics', 'NPS/CSAT', 'OUTBOUND_ESTIMATED_NPS', 'Estimated NPS', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,Admin', 'NEEDS_FORMULA', 'Needs confirmation if NPS data is collected/estimated, and the calculation method.'),

('OUTBOUND', 'Satisfaction Metrics', 'NPS/CSAT', 'OUTBOUND_ESTIMATED_CSAT', 'Estimated CSAT', 'OUTBOUND', 'db_external', 'CallDetails', NULL, 'T&Q Head,CEO,Ops Manager,Admin', 'NEEDS_FORMULA', 'Needs confirmation if CSAT data is collected/estimated, and the calculation method.');

-- Validation: Check inserted metrics
SELECT dashboard_type, COUNT(*) as metric_count, status
FROM cm_metric_definition
GROUP BY dashboard_type, status
ORDER BY dashboard_type, status;

-- Summary by status
SELECT status, COUNT(*) as count
FROM cm_metric_definition
GROUP BY status
ORDER BY FIELD(status, 'IMPLEMENTED', 'SOURCE_MAPPED', 'NEEDS_FORMULA', 'SOURCE_MISSING', 'PARTIAL');
