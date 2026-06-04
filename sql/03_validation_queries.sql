SELECT *
FROM Shivamgiri.cm_process_daily_summary
ORDER BY summary_date DESC, total_calls DESC
LIMIT 100;

SELECT
    cm.call_id,
    cm.source_call_id,
    pm.process_code,
    pm.process_name,
    pm.process_type,
    cm.source_agent_name,
    cm.lead_id,
    cm.call_datetime,
    cm.duration_sec,
    ct.transcript_id,
    LEFT(ct.transcript_text, 1000) AS transcript_preview
FROM Shivamgiri.ci_call_master cm
LEFT JOIN Shivamgiri.ci_process_master pm
    ON cm.process_id = pm.process_id
LEFT JOIN Shivamgiri.ci_call_transcript ct
    ON cm.call_id = ct.call_id
   AND ct.is_current = 1
WHERE cm.call_id = 383;
