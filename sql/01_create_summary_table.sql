DROP TABLE IF EXISTS Shivamgiri.cm_process_daily_summary;

CREATE TABLE Shivamgiri.cm_process_daily_summary (
    summary_date DATE NOT NULL,
    process_id BIGINT NOT NULL,
    process_code VARCHAR(50),
    process_name VARCHAR(255),
    process_type VARCHAR(50),

    total_calls INT DEFAULT 0,
    agent_count INT DEFAULT 0,
    transcript_available INT DEFAULT 0,
    ai_audit_completed INT DEFAULT 0,
    manual_audit_completed INT DEFAULT 0,

    avg_quality_score DECIMAL(10,2) DEFAULT NULL,
    fatal_count INT DEFAULT 0,
    escalation_count INT DEFAULT 0,
    coaching_trigger_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (summary_date, process_id),
    INDEX idx_process_date (process_id, summary_date),
    INDEX idx_process_type_date (process_type, summary_date),
    INDEX idx_process_code_date (process_code, summary_date)
);
