# Coaching Calendar Contract

## Purpose

The Coaching Calendar converts audit findings, funnel leakage, rejection reasons and live-assist risk events into scheduled coaching actions.

## Data status

Current schema status: Partial.

Existing useful tables:

- coaching_assignment
- coaching_content
- ci_tni_coaching_action
- calibration_session
- ci_audit_calibration_session

App-owned extension proposed in `sql/phase16_app_owned_tables.sql`:

- cm_coaching_calendar_event

## Page requirements

The Coaching Calendar page should include:

- Calendar view
- List view
- Agent filter
- TL filter
- Trainer filter
- Process filter
- Status filter
- Due today queue
- Missed coaching queue
- Completed coaching queue
- Coaching evidence panel
- Linked call/audit reference
- Reminder status

## Event types

| Event Type | Trigger |
|---|---|
| Funnel leakage coaching | Sales Funnel stage leakage |
| Rejection recovery coaching | Rejection Funnel reason spike |
| Live assist coaching | Critical live event or supervisor whisper |
| QA audit feedback | Low audit score or fatal parameter |
| Calibration session | QA/TL/Trainer alignment |
| Recertification | Repeated quality or compliance failure |

## Role review

### Developer

Use app-owned calendar events and link back to call/audit/coaching records through IDs.

### Designer

Use a clean schedule layout inspired by the HRMS UI reference: date blocks, status pills, agenda cards and action buttons.

### Tester

Test overdue events, completed events, cancelled events, empty calendar, role access and filters.

### Product Owner

Calendar must close the loop from insight to action. No critical insight should remain without an owner and due date.

### Business

The calendar should help TLs, Trainers and QA leaders manage daily coaching discipline.

## API contract

Suggested routes:

- GET /api/coaching-calendar/events
- GET /api/coaching-calendar/today
- GET /api/coaching-calendar/overdue
- POST /api/coaching-calendar/events
- PATCH /api/coaching-calendar/events/:eventId/status

## Safety rule

Calendar events are app-owned product data. Do not write coaching schedule data into read-only source schemas.
