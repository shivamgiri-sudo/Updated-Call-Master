REPLACE INTO Shivamgiri.cm_process_daily_summary (
    summary_date,
    process_id,
    process_code,
    process_name,
    process_type,
    total_calls,
    agent_count,
    transcript_available,
    ai_audit_completed,
    manual_audit_completed
)
SELECT
    cm.call_date AS summary_date,
    cm.process_id,
    pm.process_code,
    pm.process_name,
    pm.process_type,
    COUNT(*) AS total_calls,
    COUNT(DISTINCT cm.source_agent_name) AS agent_count,
    SUM(CASE WHEN cm.transcript_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS transcript_available,
    SUM(CASE WHEN cm.ai_audit_status = 'COMPLETED' THEN 1 ELSE 0 END) AS ai_audit_completed,
    SUM(CASE WHEN cm.manual_audit_status = 'COMPLETED' THEN 1 ELSE 0 END) AS manual_audit_completed
FROM Shivamgiri.ci_call_master cm
LEFT JOIN Shivamgiri.ci_process_master pm
    ON cm.process_id = pm.process_id
WHERE cm.call_date IS NOT NULL
GROUP BY
    cm.call_date,
    cm.process_id,
    pm.process_code,
    pm.process_name,
    pm.process_type;
