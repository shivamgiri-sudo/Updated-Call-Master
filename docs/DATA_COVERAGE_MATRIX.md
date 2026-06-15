# Call Master Data Coverage Matrix

This matrix checks whether the current MySQL schemas contain enough data fields for the SaaS modules being built.

## Summary

| Module | Data status | Notes |
|---|---|---|
| Executive IQ | Ready | Supported by daily KPI, risk, action, process and audit summary tables. |
| Sales Funnel | Ready | Supported by external CallDetails and app sales intelligence tables. |
| Rejection Funnel | Ready | Supported by opening rejection, offer rejection, objection, rebuttal and not-interested fields. |
| Live Assist | Partial | Transcript and alert tables exist, but true live stream/session tables are still needed. |
| AI Studio | Ready | Prompt version, audit framework and AI result tables exist. |
| Best Call Library | Ready | Best call library and coaching content tables exist. |
| SaaS Control | Partial | User scope and client-process mapping exist; tenant isolation tables are still missing. |
| Critical Insights | Ready | Insight, risk, alert, coaching and governance tables exist. |
| Enterprise Readiness | Partial | Go-live checklist tables exist; observability tables still needed. |
| Email Template Center | Missing | No clear email template table found in current schema. |
| Coaching Calendar | Partial | Coaching assignments exist; calendar/schedule table is missing. |
| Client Portal | Partial | Client-process mapping exists; client portal permissions and external sharing tables are missing. |

## Key source tables

### db_external

- CallDetails
- call_analysis
- bot_tagging
- feedback_data
- feedback_table
- tbl_client
- tbl_obj

### db_audit

- call_quality_assessment
- feedback_table

### Shivamgiri

- ci_call_master
- ci_call_transcript
- ci_ai_audit_result
- ci_ai_audit_parameter_result
- ci_sales_intelligence_fact
- ci_journey_event_fact
- ci_sales_funnel_summary_daily
- ci_kpi_summary_daily
- ci_risk_summary_daily
- ci_action_summary_daily
- ci_audit_framework_master
- ci_audit_framework_rule
- ci_audit_parameter_master
- ci_ai_prompt_version_master
- audit_prompt_config
- call_best_call_library
- coaching_content
- coaching_assignment
- cm_coaching_trigger
- cm_governance_action
- app_notification
- quality_alert
- ci_alert_event_fact
- ci_client_process_mapping
- ci_user_scope_assignment

## Feature-by-feature decision

### Executive IQ

Use current data.

Recommended tables:

- ci_kpi_summary_daily
- ci_risk_summary_daily
- ci_action_summary_daily
- cm_process_daily_summary
- ci_process_master
- ci_ai_audit_result
- cm_governance_action
- cm_coaching_trigger

Missing only production aggregation queries and row-level validation.

### Sales Funnel

Use current data.

Recommended source fields:

- Opening
- Offered
- ObjectionHandling
- PrepaidPitch
- UpsellingEfforts
- OfferUrgency
- SaleDone
- ProductOffering
- DiscountType
- CallDisposition

Recommended app tables:

- ci_sales_intelligence_fact
- ci_sales_funnel_summary_daily
- ci_journey_event_fact

Revenue is available if revenue_value is populated in ci_sales_intelligence_fact. If not, use configured estimated revenue per conversion until Finance provides actual revenue mapping.

### Rejection Funnel

Use current data.

Recommended source fields:

- OpeningRejected
- OfferingRejected
- AfterListeningOfferRejected
- NotInterestedReasonCallContext
- NotInterestedBucketReason
- CustomerObjectionCategory
- CustomerObjectionSubCategory
- AgentRebuttalCategory
- AgentRebuttalSubCategory
- Reason_for_Not_Placing_Order

This is enough to build a strong rejection transition page.

### Live Assist

Partial data only.

Existing useful tables:

- ci_call_transcript
- ci_call_processing_queue
- ci_alert_event_fact
- quality_alert
- app_notification

Missing:

- live_session
- live_transcript_chunk
- live_assist_event
- live_next_best_action
- supervisor_whisper

Live Assist can remain demo-safe for now. Production needs streaming integration.

### AI Studio

Use current data.

Existing useful tables:

- ci_ai_prompt_version_master
- audit_prompt_config
- ci_audit_framework_master
- ci_audit_framework_rule
- ci_audit_parameter_master
- ci_ai_audit_result
- ci_ai_audit_parameter_result

This is enough for prompt version visibility, framework builder, model tracking and validation status.

### Best Call Library

Use current data.

Existing useful tables:

- call_best_call_library
- coaching_content
- coaching_assignment
- ci_tni_coaching_action
- ci_call_master
- ci_call_transcript
- ci_ai_audit_result

This is enough for a best-call library, coaching playlist and agent assignment flow.

### SaaS Control

Partial data.

Existing useful tables:

- user_master
- user_scope_mapping
- ci_user_scope_assignment
- ci_client_process_mapping
- ci_process_master
- ci_branch_master

Missing:

- tenant_master
- tenant_user
- tenant_feature_flag
- tenant_usage_daily
- tenant_api_key
- tenant_billing_usage

Build current UI as admin demo. Production SaaS requires tenant schema.

### Email Template Center

Missing.

No clear email template table was found in the current schema summary.

Recommended new app-owned tables:

- cm_email_template_master
- cm_email_template_version
- cm_email_event_log
- cm_email_recipient_rule
- cm_email_render_preview

### Coaching Calendar

Partial data.

Existing useful tables:

- coaching_assignment
- coaching_content
- ci_tni_coaching_action
- calibration_session
- ci_audit_calibration_session

Missing:

- coaching_calendar_event
- coaching_session_attendance
- coaching_reminder_log

## Important safety rule

The uploaded database summary marks source databases as read-only. Build read-only analytics from source databases and write new application data only to an approved app-owned schema.
