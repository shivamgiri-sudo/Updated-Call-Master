# Phase 17 Progress Report

## Goal

Continue building Call Master Enterprise IQ in the same GitHub repository while checking whether the MySQL schemas support each feature.

## Completed in this phase

### 1. Data Coverage Matrix

Added `docs/DATA_COVERAGE_MATRIX.md`.

This document classifies each product module as Ready, Partial or Missing based on the uploaded MySQL schemas.

Ready modules:

- Executive IQ
- Sales Funnel
- Rejection Funnel
- AI Studio
- Best Call Library
- Critical Insights

Partial modules:

- Live Assist
- SaaS Control
- Enterprise Readiness
- Coaching Calendar
- Client Portal

Missing module:

- Email Template Center

### 2. App-owned table proposals

Added `sql/phase16_app_owned_tables.sql`.

This contains safe app-owned table proposals for:

- Email template catalog
- Email template versions
- Email event log
- Live call sessions
- Live transcript chunks
- Live assist events
- SaaS tenant master
- Tenant feature flags
- Coaching calendar events

These tables must be created only in the approved application database, not in read-only source schemas.

### 3. Read-only production query templates

Added `sql/phase17_readonly_sales_rejection_queries.sql`.

This contains read-only templates for:

- Sales funnel daily summary
- Sales leakage by agent
- Rejection funnel summary
- Rejection reason breakdown

These queries use `db_external.CallDetails` and should be parameterized by date range.

### 4. MySQL-backed funnel API upgrade

Updated `backend/src/modules/funnels/funnels.routes.ts`.

The Sales Funnel and Rejection Funnel routes now attempt read-only MySQL aggregation first.

If the database is unavailable, client mapping is missing, or credentials are not configured, the routes return the premium demo fallback payload instead of breaking the UI.

Updated routes:

- `/api/funnels/:processCode/sales-transition`
- `/api/funnels/:processCode/rejection-transition`

The API response now includes a `source` field:

- `mysql_readonly` when live read-only data is returned
- `demo_fallback` when fallback data is returned

### 5. Funnel frontend polish

Updated `frontend/src/EnterpriseConsole.tsx` and added `frontend/src/funnel-polish.css`.

Sales Funnel and Rejection Funnel now show:

- MySQL vs demo fallback source banner
- KPI cards
- Funnel stages
- Agent impact table
- Role review cards
- Communication template previews
- Data-safe page-cycle structure

## Data conclusion

The current database is strong enough to build the main analytics product:

- Executive dashboards
- Sales funnel analytics
- Rejection analytics
- AI prompt governance
- Best-call library
- Critical insight cards

The database is not yet complete for true real-time SaaS features:

- Live streaming
- Email template engine
- Tenant isolation
- Coaching calendar reminders
- Client portal sharing

## Next target

Continue the page-by-page build cycle:

1. Validate Sales Funnel and Rejection Funnel with real DB credentials
2. Start Live Assist partial-production design
3. Build Email Template Center using app-owned schema
4. Build Coaching Calendar using app-owned schema
5. Bind AI Studio to prompt and framework tables
6. Bind Best Call Library to coaching and call library tables

## Safety rule

Use source schemas for read-only analytics. Use approved app-owned schema for new product data.
