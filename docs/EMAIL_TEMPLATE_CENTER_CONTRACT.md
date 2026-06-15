# Email Template Center Contract

## Purpose

The Email Template Center standardizes all communication templates connected to Call Master pages.

## Data status

Current schema status: Missing in existing source schemas.

App-owned schema proposal exists in `sql/phase16_app_owned_tables.sql`.

Required tables:

- cm_email_template_master
- cm_email_template_version
- cm_email_event_log

## Initial templates

| Code | Page | Audience | Purpose |
|---|---|---|---|
| EXEC_DAILY_SUMMARY | Executive IQ | CEO, T&Q, Ops | Daily leadership summary |
| SALES_LEAKAGE_ALERT | Sales Funnel | Ops, QA, Trainer, TL | Critical stage leakage alert |
| REJECTION_SPIKE_ALERT | Rejection Funnel | Ops, QA, Trainer, TL | Rejection spike alert |
| LIVE_ASSIST_RISK_ALERT | Live Assist | Supervisor, QA, TL | Live risk intervention |
| COACHING_ASSIGNMENT | Coaching Calendar | Agent, TL, Trainer | Coaching assignment and due date |

## Page requirements

The Email Template Center page should include:

- Template list
- Module filter
- Audience filter
- Approval status filter
- Version history
- Preview panel
- Subject line editor
- HTML/text body editor
- Layout preview
- Test-render action
- Approval workflow
- Event log

## Role review

### Developer

Build templates as app-owned data only. Do not write template state to read-only source databases.

### Designer

Use a split layout: template list on the left, preview/editor on the right.

### Tester

Test missing template, draft version, approved version, preview rendering, and failed render states.

### Product Owner

Every page must have at least one connected email template before the page is marked complete.

### Business

Templates must be action-first: summary, evidence, owner, deadline, next step.

## API contract

Suggested routes:

- GET /api/email-templates/templates
- GET /api/email-templates/versions
- GET /api/email-templates/readiness
- POST /api/email-templates/render-preview
- POST /api/email-templates/approve

## Safety rule

Email templates are app-owned product data. Use only the approved application database.
