-- Phase 17 read-only query templates for Sales Funnel and Rejection Funnel
-- These queries are for analytics only. Do not run write operations on source schemas.

-- SALES FUNNEL DAILY SUMMARY
SELECT
  DATE(cd.CallDate) AS call_date,
  cd.client_id,
  COUNT(*) AS total_calls,
  SUM(CASE WHEN LOWER(TRIM(cd.Opening)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS opening_done,
  SUM(CASE WHEN LOWER(TRIM(cd.Offered)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS offered_done,
  SUM(CASE WHEN LOWER(TRIM(cd.ObjectionHandling)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS objection_handled,
  SUM(CASE WHEN LOWER(TRIM(cd.PrepaidPitch)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS prepaid_pitch_done,
  SUM(CASE WHEN LOWER(TRIM(cd.UpsellingEfforts)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS upsell_attempted,
  SUM(CASE WHEN LOWER(TRIM(cd.OfferUrgency)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS urgency_done,
  SUM(CASE WHEN LOWER(TRIM(cd.SaleDone)) IN ('yes','y','1','true','done','pass','sale done') THEN 1 ELSE 0 END) AS sale_done,
  ROUND(100 * SUM(CASE WHEN LOWER(TRIM(cd.SaleDone)) IN ('yes','y','1','true','done','pass','sale done') THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 2) AS conversion_percent
FROM db_external.CallDetails cd
WHERE cd.CallDate >= ? AND cd.CallDate < ?
GROUP BY DATE(cd.CallDate), cd.client_id;

-- SALES LEAKAGE BY AGENT
SELECT
  cd.AgentName,
  COUNT(*) AS total_calls,
  SUM(CASE WHEN LOWER(TRIM(cd.Opening)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS opening_done,
  SUM(CASE WHEN LOWER(TRIM(cd.Offered)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS offered_done,
  SUM(CASE WHEN LOWER(TRIM(cd.ObjectionHandling)) IN ('yes','y','1','true','done','pass') THEN 1 ELSE 0 END) AS objection_handled,
  SUM(CASE WHEN LOWER(TRIM(cd.SaleDone)) IN ('yes','y','1','true','done','pass','sale done') THEN 1 ELSE 0 END) AS sale_done
FROM db_external.CallDetails cd
WHERE cd.CallDate >= ? AND cd.CallDate < ?
GROUP BY cd.AgentName
ORDER BY sale_done DESC, total_calls DESC;

-- REJECTION FUNNEL SUMMARY
SELECT
  DATE(cd.CallDate) AS call_date,
  cd.client_id,
  COUNT(*) AS total_calls,
  SUM(CASE WHEN LOWER(TRIM(cd.OpeningRejected)) IN ('yes','y','1','true') THEN 1 ELSE 0 END) AS opening_rejected,
  SUM(CASE WHEN LOWER(TRIM(cd.OfferingRejected)) IN ('yes','y','1','true') THEN 1 ELSE 0 END) AS offering_rejected,
  SUM(CASE WHEN LOWER(TRIM(cd.AfterListeningOfferRejected)) IN ('yes','y','1','true') THEN 1 ELSE 0 END) AS after_listening_rejected,
  SUM(CASE WHEN cd.CustomerObjectionCategory IS NOT NULL AND TRIM(cd.CustomerObjectionCategory) <> '' THEN 1 ELSE 0 END) AS objection_recorded,
  SUM(CASE WHEN cd.AgentRebuttalCategory IS NOT NULL AND TRIM(cd.AgentRebuttalCategory) <> '' THEN 1 ELSE 0 END) AS rebuttal_recorded,
  SUM(CASE WHEN LOWER(TRIM(cd.SaleDone)) NOT IN ('yes','y','1','true','done','pass','sale done') THEN 1 ELSE 0 END) AS final_lost
FROM db_external.CallDetails cd
WHERE cd.CallDate >= ? AND cd.CallDate < ?
GROUP BY DATE(cd.CallDate), cd.client_id;

-- REJECTION REASON BREAKDOWN
SELECT
  COALESCE(NULLIF(TRIM(cd.NotInterestedBucketReason),''), NULLIF(TRIM(cd.CustomerObjectionCategory),''), 'Unclassified') AS rejection_reason,
  COUNT(*) AS call_count,
  SUM(CASE WHEN cd.AgentRebuttalCategory IS NOT NULL AND TRIM(cd.AgentRebuttalCategory) <> '' THEN 1 ELSE 0 END) AS rebuttal_attempted,
  SUM(CASE WHEN LOWER(TRIM(cd.SaleDone)) IN ('yes','y','1','true','done','pass','sale done') THEN 1 ELSE 0 END) AS recovered_sales
FROM db_external.CallDetails cd
WHERE cd.CallDate >= ? AND cd.CallDate < ?
GROUP BY rejection_reason
ORDER BY call_count DESC;
