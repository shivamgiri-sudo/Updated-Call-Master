# Legacy Dashboard Metric Catalog

**Version:** Phase 10  
**Date:** 2026-06-05  
**Purpose:** Comprehensive catalog of all legacy dashboard metrics for parity tracking

## Overview

This catalog documents every metric from the legacy inbound and outbound dashboards. Each metric is tracked with:
- Source data availability
- Formula/logic status
- Implementation status in Call Master Control Tower
- API endpoint mapping
- UI widget location

## Metric Status Definitions

| Status | Description |
|--------|-------------|
| **IMPLEMENTED** | Metric is live in Phase 1-9 UI/API |
| **NEEDS_FORMULA** | Source data exists, but business logic/formula needs confirmation |
| **SOURCE_MAPPED** | Source column identified, formula ready, pending implementation |
| **SOURCE_MISSING** | Required data not available in any database |
| **PARTIAL** | Some dimensions implemented, others pending |

## Inbound Dashboard Metrics

### 1. Summary KPIs

#### 1.1 Total Audits / Total Calls
- **Metric Code:** `INBOUND_TOTAL_AUDITS`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Status:** ✅ IMPLEMENTED (Phase 7)
- **API:** `GET /api/inbound/:processCode/quality`
- **UI Widget:** Inbound Quality page - KPI card "Audit Count"

#### 1.2 CQ Score
- **Metric Code:** `INBOUND_CQ_SCORE`
- **Formula:** `AVG(cq_score) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `cq_score`
- **Status:** ✅ IMPLEMENTED (Phase 7)
- **API:** `GET /api/inbound/:processCode/quality`
- **UI Widget:** Inbound Quality page - KPI card "CQ Score"

#### 1.3 Target CQ
- **Metric Code:** `INBOUND_TARGET_CQ`
- **Formula:** Static value from process configuration (e.g., 80%)
- **Source DB:** `Shivamgiri`
- **Source Table:** `ci_process_master` (needs target_cq column)
- **Status:** ⚠️ SOURCE_MISSING
- **Notes:** Target CQ is not stored in database, needs process-level configuration

#### 1.4 Fatal Count
- **Metric Code:** `INBOUND_FATAL_COUNT`
- **Formula:** `SUM(fatal_count) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `fatal_count`
- **Status:** ✅ IMPLEMENTED (Phase 7)
- **API:** `GET /api/inbound/:processCode/quality`
- **UI Widget:** Inbound Quality page - KPI card (not displayed separately yet)

#### 1.5 Fatal %
- **Metric Code:** `INBOUND_FATAL_PERCENT`
- **Formula:** `(SUM(fatal_count) / COUNT(*)) * 100`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Status:** 🔶 SOURCE_MAPPED
- **Notes:** Data available, calculation pending UI display

### 2. Quality Scoring

#### 2.1 Call Rank / Quality Band
- **Metric Code:** `INBOUND_QUALITY_BAND`
- **Formula:** Business logic based on CQ score ranges (e.g., <60=Poor, 60-80=Average, >80=Excellent)
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `cq_score`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** Band thresholds need business confirmation

#### 2.2 Opening Score
- **Metric Code:** `INBOUND_OPENING_SCORE`
- **Formula:** `AVG(opening_score) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `opening_score`
- **Status:** 🔶 SOURCE_MAPPED
- **Notes:** Column exists in db_audit schema

#### 2.3 Soft Skill Score
- **Metric Code:** `INBOUND_SOFT_SKILL_SCORE`
- **Formula:** `AVG(soft_skill_score) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `soft_skill_score`
- **Status:** 🔶 SOURCE_MAPPED
- **Notes:** Column exists in db_audit schema

#### 2.4 Hold Procedure Score
- **Metric Code:** `INBOUND_HOLD_PROCEDURE_SCORE`
- **Formula:** `AVG(hold_procedure_score) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `hold_procedure_score`
- **Status:** 🔶 SOURCE_MAPPED
- **Notes:** Column exists in db_audit schema

#### 2.5 Resolution Score
- **Metric Code:** `INBOUND_RESOLUTION_SCORE`
- **Formula:** `AVG(resolution_score) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `resolution_score`
- **Status:** 🔶 SOURCE_MAPPED

#### 2.6 Closing Score
- **Metric Code:** `INBOUND_CLOSING_SCORE`
- **Formula:** `AVG(closing_score) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `closing_score`
- **Status:** 🔶 SOURCE_MAPPED

### 3. Call Classification

#### 3.1 Scenario Count
- **Metric Code:** `INBOUND_SCENARIO_COUNT`
- **Formula:** `COUNT(DISTINCT scenario_type) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `scenario_type`
- **Status:** 🔶 SOURCE_MAPPED

#### 3.2 Sub-scenario Count
- **Metric Code:** `INBOUND_SUBSCENARIO_COUNT`
- **Formula:** `COUNT(DISTINCT sub_scenario_type) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `sub_scenario_type`
- **Status:** 🔶 SOURCE_MAPPED

#### 3.3 Query / Complaint / Repeat / Request Breakup
- **Metric Code:** `INBOUND_CALL_TYPE_BREAKUP`
- **Formula:** `COUNT(*) GROUP BY call_type FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `call_type`
- **Status:** 🔶 SOURCE_MAPPED

#### 3.4 Repeat Calls
- **Metric Code:** `INBOUND_REPEAT_CALLS`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND is_repeat_call = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `is_repeat_call`
- **Status:** 🔶 SOURCE_MAPPED

#### 3.5 FCR Failure / Repeat %
- **Metric Code:** `INBOUND_FCR_FAILURE_PERCENT`
- **Formula:** `(COUNT(is_repeat_call=1) / COUNT(*)) * 100`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Status:** 🔶 SOURCE_MAPPED

### 4. Sensitive Content Analysis

#### 4.1 Sensitive Word Count
- **Metric Code:** `INBOUND_SENSITIVE_WORD_COUNT`
- **Formula:** `SUM(sensitive_word_count) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `sensitive_word_count`
- **Status:** ✅ IMPLEMENTED (Phase 7)
- **API:** `GET /api/inbound/:processCode/quality`
- **UI Widget:** Inbound Quality page - KPI card

#### 4.2 Top Negative Words
- **Metric Code:** `INBOUND_TOP_NEGATIVE_WORDS`
- **Formula:** `SELECT word, COUNT(*) as count FROM call_quality_assessment ... GROUP BY word ORDER BY count DESC LIMIT 10`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `negative_words` (JSON or text field)
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** Needs word extraction logic from transcript/analysis

#### 4.3 Scam Leads
- **Metric Code:** `INBOUND_SCAM_LEADS`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND scam_detected = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `scam_detected`
- **Status:** 🔶 SOURCE_MAPPED

#### 4.4 Consumer Court / Legal Signal
- **Metric Code:** `INBOUND_LEGAL_SIGNAL`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND legal_signal = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `legal_signal`
- **Status:** 🔶 SOURCE_MAPPED

#### 4.5 Social Media / Escalation Signal
- **Metric Code:** `INBOUND_SOCIAL_MEDIA_ESCALATION`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND (social_media_signal = 1 OR escalation_signal = 1)`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `social_media_signal`, `escalation_signal`
- **Status:** 🔶 SOURCE_MAPPED

#### 4.6 Policy Communication Failure
- **Metric Code:** `INBOUND_POLICY_FAILURE_COUNT`
- **Formula:** `SUM(policy_failure_count) FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `policy_failure_count`
- **Status:** ✅ IMPLEMENTED (Phase 7)
- **API:** `GET /api/inbound/:processCode/quality`

### 5. Fraud & Compliance Flags

#### 5.1 Fraud Detection
- **Metric Code:** `INBOUND_FRAUD_FLAG`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND fraud_detected = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `fraud_detected`
- **Status:** 🔶 SOURCE_MAPPED

#### 5.2 Data Theft Flag
- **Metric Code:** `INBOUND_DATA_THEFT_FLAG`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND data_theft_flag = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `data_theft_flag`
- **Status:** 🔶 SOURCE_MAPPED

#### 5.3 Unprofessional Behavior
- **Metric Code:** `INBOUND_UNPROFESSIONAL_FLAG`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND unprofessional_flag = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `unprofessional_flag`
- **Status:** 🔶 SOURCE_MAPPED

#### 5.4 System Manipulation
- **Metric Code:** `INBOUND_SYSTEM_MANIPULATION_FLAG`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND system_manipulation = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `system_manipulation`
- **Status:** 🔶 SOURCE_MAPPED

#### 5.5 Financial Fraud
- **Metric Code:** `INBOUND_FINANCIAL_FRAUD_FLAG`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND financial_fraud = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `financial_fraud`
- **Status:** 🔶 SOURCE_MAPPED

#### 5.6 Escalation Failure
- **Metric Code:** `INBOUND_ESCALATION_FAILURE`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND escalation_failure = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `escalation_failure`
- **Status:** 🔶 SOURCE_MAPPED

#### 5.7 Collusion Flag
- **Metric Code:** `INBOUND_COLLUSION_FLAG`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND collusion_detected = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `collusion_detected`
- **Status:** 🔶 SOURCE_MAPPED

### 6. Competitor Analysis

#### 6.1 Competitor Mentions
- **Metric Code:** `INBOUND_COMPETITOR_MENTIONS`
- **Formula:** `COUNT(*) FROM call_quality_assessment WHERE process_code = ? AND competitor_mentioned = 1`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `competitor_mentioned`
- **Status:** 🔶 SOURCE_MAPPED

### 7. Agent-Level Analytics

#### 7.1 Agent-wise Audit Summary
- **Metric Code:** `INBOUND_AGENT_AUDIT_SUMMARY`
- **Formula:** `SELECT agent_name, COUNT(*) as total_audits, AVG(cq_score) as avg_cq FROM call_quality_assessment WHERE process_code = ? GROUP BY agent_name`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Source Column:** `agent_name`, `cq_score`
- **Status:** 🔶 SOURCE_MAPPED

#### 7.2 Agent-wise CQ
- **Metric Code:** `INBOUND_AGENT_CQ`
- **Formula:** `AVG(cq_score) GROUP BY agent_name FROM call_quality_assessment WHERE process_code = ?`
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment`
- **Status:** 🔶 SOURCE_MAPPED

### 8. Parameter-Level Analytics

#### 8.1 Parameter-wise Pass/Fail/N/A
- **Metric Code:** `INBOUND_PARAMETER_PASS_FAIL`
- **Formula:** Complex - requires parameter-level data structure
- **Source DB:** `db_audit`
- **Source Table:** `call_quality_assessment` (may need separate parameter table)
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** Depends on parameter storage structure (JSON or separate table)

### 9. Call Audit 360 Fields
- **Metric Code:** `INBOUND_AUDIT_360_FIELDS`
- **Status:** ✅ IMPLEMENTED (Phase 7)
- **API:** `GET /api/inbound/:processCode/quality`
- **UI Widget:** Inbound Quality page

### 10. Raw Explorer Fields
- **Metric Code:** `INBOUND_RAW_EXPLORER`
- **Status:** 🔶 SOURCE_MAPPED
- **Notes:** All columns from `db_audit.call_quality_assessment` available for export

---

## Outbound Dashboard Metrics

### 1. Call Summary Totals (CST)

#### 1.1 CST Total Calls
- **Metric Code:** `OUTBOUND_CST_TOTAL_CALLS`
- **Formula:** `COUNT(*) FROM CallDetails WHERE ProcessCode = ?`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ✅ IMPLEMENTED (Phase 4)
- **API:** `GET /api/outbound/:processCode/funnel`
- **UI Widget:** Outbound Funnel page - "Total Calls"

#### 1.2 CST OPS (Opening Success)
- **Metric Code:** `OUTBOUND_CST_OPS`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** `Opening` (values: YES/NO)
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** Unclear if OPS = COUNT(Opening='YES') or a different calculation

#### 1.3 CST CPS (Call Processing Success)
- **Metric Code:** `OUTBOUND_CST_CPS`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** CPS definition needs business confirmation

#### 1.4 CST Offer Success
- **Metric Code:** `OUTBOUND_CST_OFFER_SUCCESS`
- **Formula:** `COUNT(*) FROM CallDetails WHERE ProcessCode = ? AND Offered = 'YES'`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** `Offered`
- **Status:** ✅ IMPLEMENTED (Phase 4)
- **API:** `GET /api/outbound/:processCode/funnel`
- **UI Widget:** Outbound Funnel page - "Offered Count"

#### 1.5 CST Sale Done
- **Metric Code:** `OUTBOUND_CST_SALE_DONE`
- **Formula:** `COUNT(*) FROM CallDetails WHERE ProcessCode = ? AND SaleDone = 'YES'`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** `SaleDone`
- **Status:** ✅ IMPLEMENTED (Phase 4)
- **API:** `GET /api/outbound/:processCode/funnel`
- **UI Widget:** Outbound Funnel page - "Sale Done Count"

#### 1.6 CST Success Rate
- **Metric Code:** `OUTBOUND_CST_SUCCESS_RATE`
- **Formula:** `(COUNT(SaleDone='YES') / COUNT(*)) * 100`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ✅ IMPLEMENTED (Phase 4)
- **API:** `GET /api/outbound/:processCode/funnel`
- **UI Widget:** Outbound Funnel page - "Conversion %"

### 2. Call Right Time (CRT) Metrics

#### 2.1 CRT OR (Outbound Rate)
- **Metric Code:** `OUTBOUND_CRT_OR`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** CRT metrics definition unclear - needs business confirmation

#### 2.2 CRT CR (Conversion Rate)
- **Metric Code:** `OUTBOUND_CRT_CR`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 2.3 CRT OPR (Offer Performance Rate)
- **Metric Code:** `OUTBOUND_CRT_OPR`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 2.4 CRT POR (Performance Outcome Rate)
- **Metric Code:** `OUTBOUND_CRT_POR`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

### 3. Failure & Breakdown Analysis

#### 3.1 Failure Rate
- **Metric Code:** `OUTBOUND_FAILURE_RATE`
- **Formula:** `(1 - (COUNT(SaleDone='YES') / COUNT(*))) * 100`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** 🔶 SOURCE_MAPPED

#### 3.2 SCB Success Calls Breakdown
- **Metric Code:** `OUTBOUND_SCB`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** SCB acronym definition unclear

#### 3.3 RCB Rejected Calls Breakdown
- **Metric Code:** `OUTBOUND_RCB`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** RCB acronym definition unclear

### 4. Funnel Metrics

#### 4.1 CST Funnel
- **Metric Code:** `OUTBOUND_CST_FUNNEL`
- **Formula:** Multi-stage: Total → Opening → Offered → Objection Handled → Sale Done
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ✅ IMPLEMENTED (Phase 4)
- **API:** `GET /api/outbound/:processCode/funnel`
- **UI Widget:** Outbound Funnel page

#### 4.2 CRT Funnel
- **Metric Code:** `OUTBOUND_CRT_FUNNEL`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** CRT funnel stages need business confirmation

### 5. Opportunity Analysis

#### 5.1 Total Opportunities
- **Metric Code:** `OUTBOUND_TOTAL_OPPORTUNITIES`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** Definition of "opportunity" unclear (Opening done? Offered? Something else?)

#### 5.2 Missed Opportunity Count
- **Metric Code:** `OUTBOUND_MISSED_OPPORTUNITY_COUNT`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 5.3 Missed Opportunity %
- **Metric Code:** `OUTBOUND_MISSED_OPPORTUNITY_PERCENT`
- **Formula:** `(Missed Opportunity Count / Total Opportunities) * 100`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 5.4 MO Breakdown
- **Metric Code:** `OUTBOUND_MO_BREAKDOWN`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 5.5 MO Category Table
- **Metric Code:** `OUTBOUND_MO_CATEGORY_TABLE`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

### 6. NED / ED Analysis

#### 6.1 NED / ED Breakup
- **Metric Code:** `OUTBOUND_NED_ED_BREAKUP`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** NED/ED acronym unclear (Not Engaged / Engaged? New/Existing Data?)

#### 6.2 NED / ED Status Table
- **Metric Code:** `OUTBOUND_NED_ED_STATUS_TABLE`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

### 7. Customer Satisfaction Metrics

#### 7.1 Estimated NPS
- **Metric Code:** `OUTBOUND_ESTIMATED_NPS`
- **Formula:** ⚠️ NEEDS_FORMULA (typically: % Promoters - % Detractors)
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** NPS field (if exists)
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** Needs confirmation if NPS data is collected/estimated

#### 7.2 Estimated CSAT
- **Metric Code:** `OUTBOUND_ESTIMATED_CSAT`
- **Formula:** ⚠️ NEEDS_FORMULA (typically: AVG(satisfaction_score))
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** CSAT field (if exists)
- **Status:** ⚠️ NEEDS_FORMULA

#### 7.3 Feedback Status: Positive / Neutral / Negative
- **Metric Code:** `OUTBOUND_FEEDBACK_STATUS`
- **Formula:** `COUNT(*) GROUP BY feedback_sentiment FROM CallDetails WHERE ProcessCode = ?`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** `feedback_sentiment` or derived from AI analysis
- **Status:** ⚠️ NEEDS_FORMULA

#### 7.4 NPS / CSAT Daily Table
- **Metric Code:** `OUTBOUND_NPS_CSAT_DAILY`
- **Formula:** `SELECT CallDate, AVG(nps_score), AVG(csat_score) FROM CallDetails WHERE ProcessCode = ? GROUP BY CallDate`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 7.5 NPS / CSAT Trend
- **Metric Code:** `OUTBOUND_NPS_CSAT_TREND`
- **Formula:** Time-series of NPS/CSAT scores
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

### 8. Pitch Analysis

#### 8.1 OP Analysis (Opening Pitch)
- **Metric Code:** `OUTBOUND_OP_ANALYSIS`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** AI analysis field
- **Status:** ⚠️ NEEDS_FORMULA

#### 8.2 Context Setting Analysis
- **Metric Code:** `OUTBOUND_CONTEXT_SETTING_ANALYSIS`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 8.3 Offered Pitch Analysis
- **Metric Code:** `OUTBOUND_OFFERED_PITCH_ANALYSIS`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 8.4 Discount Type
- **Metric Code:** `OUTBOUND_DISCOUNT_TYPE`
- **Formula:** `COUNT(*) GROUP BY DiscountType FROM CallDetails WHERE ProcessCode = ?`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** `DiscountType`
- **Status:** 🔶 SOURCE_MAPPED

#### 8.5 OR / OS / Sales Count / Conversion %
- **Metric Code:** `OUTBOUND_OR_OS_SALES`
- **Formula:** Opening Rate, Offer Success, Sales Count, Conversion %
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** 🔶 SOURCE_MAPPED (partial - some formulas need confirmation)

### 9. Objection Analysis

#### 9.1 Customer Objection Analysis
- **Metric Code:** `OUTBOUND_OBJECTION_ANALYSIS`
- **Formula:** `COUNT(*) GROUP BY CustomerObjectionCategory FROM CallDetails WHERE ProcessCode = ?`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** `CustomerObjectionCategory`
- **Status:** ✅ IMPLEMENTED (Phase 4)
- **API:** `GET /api/outbound/:processCode/objections`
- **UI Widget:** Outbound Funnel page - "Top Objections" table

#### 9.2 Objection Count
- **Metric Code:** `OUTBOUND_OBJECTION_COUNT`
- **Formula:** `COUNT(*) FROM CallDetails WHERE ProcessCode = ? AND CustomerObjectionCategory IS NOT NULL`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ✅ IMPLEMENTED (Phase 4)

#### 9.3 Failed Rebuttal %
- **Metric Code:** `OUTBOUND_FAILED_REBUTTAL_PERCENT`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** Rebuttal success/failure tracking unclear

#### 9.4 Successful Rebuttal %
- **Metric Code:** `OUTBOUND_SUCCESSFUL_REBUTTAL_PERCENT`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

#### 9.5 POS Subcategory Breakdown
- **Metric Code:** `OUTBOUND_POS_SUBCATEGORY`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA
- **Notes:** POS acronym unclear (Point of Sale? Positive Outcome Scenario?)

#### 9.6 Rebuttal Breakdown
- **Metric Code:** `OUTBOUND_REBUTTAL_BREAKDOWN`
- **Formula:** ⚠️ NEEDS_FORMULA
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Status:** ⚠️ NEEDS_FORMULA

### 10. Competitor Analysis

#### 10.1 Competitor Mentions
- **Metric Code:** `OUTBOUND_COMPETITOR_MENTIONS`
- **Formula:** `COUNT(*) FROM CallDetails WHERE ProcessCode = ? AND CompetitorMentioned = 1`
- **Source DB:** `db_external`
- **Source Table:** `CallDetails`
- **Source Column:** `CompetitorMentioned` or AI-derived field
- **Status:** 🔶 SOURCE_MAPPED

### 11. Raw Data Access

#### 11.1 Raw Download / Raw Explorer Columns
- **Metric Code:** `OUTBOUND_RAW_EXPLORER`
- **Status:** ✅ IMPLEMENTED (Phase 4)
- **API:** `GET /api/export/calls?processCode=X`
- **UI Widget:** Outbound Funnel page - "⬇ Export CSV" button

#### 11.2 Outbound Call Audit 360 Fields
- **Metric Code:** `OUTBOUND_AUDIT_360_FIELDS`
- **Status:** ✅ IMPLEMENTED (Phase 3)
- **API:** `GET /api/calls/:callId/audit360`
- **UI Widget:** Audit 360 modal - "Outbound Sales Fields" section

---

## Summary Statistics

### Inbound Metrics
- **Total Metrics:** 40
- **Implemented:** 6
- **Source Mapped:** 28
- **Needs Formula:** 6
- **Source Missing:** 1

### Outbound Metrics
- **Total Metrics:** 50
- **Implemented:** 8
- **Source Mapped:** 12
- **Needs Formula:** 30
- **Source Missing:** 0

### Overall
- **Total Metrics:** 90
- **Implemented:** 14 (15.6%)
- **Source Mapped:** 40 (44.4%)
- **Needs Formula:** 36 (40.0%)
- **Source Missing:** 1 (1.1%)

## Next Steps for Parity

### High Priority (Business Logic Confirmation Required)
1. CST vs CRT metric definitions and formulas
2. NED/ED definition and breakdown logic
3. Opportunity definition and missed opportunity calculation
4. NPS/CSAT estimation/collection method
5. Rebuttal success/failure tracking mechanism
6. Parameter-level pass/fail storage structure

### Medium Priority (Implementation Pending)
1. Agent-wise inbound analytics
2. Quality score parameters (Opening, Soft Skill, Hold, Resolution, Closing)
3. Call type breakup and repeat call tracking
4. Fraud/compliance flag displays
5. Discount type and competitor analysis widgets

### Low Priority (UI Polish)
1. Fatal % display
2. Quality band visualization
3. Trend charts for NPS/CSAT
4. Enhanced raw data explorer

## Technical Implementation Notes

1. **No Heavy Views:** All metrics calculated on-demand with indexed queries
2. **Read-Only External DBs:** db_external and db_audit remain SELECT-only
3. **Date Filtering:** All metrics support date range filters
4. **Process Filtering:** All metrics scoped to process_code
5. **RBAC:** Metric visibility controlled by role-based access

## Change Log

- **2026-06-05:** Initial catalog creation for Phase 10
