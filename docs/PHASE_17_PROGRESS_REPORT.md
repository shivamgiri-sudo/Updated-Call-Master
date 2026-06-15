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

## Current blocker

Some direct backend route-file pushes were blocked by the GitHub connector safety layer. Documentation and SQL pushes succeeded. Continue pushing smaller safe increments and validate each successful commit.

## Next target

Continue the page-by-page build cycle:

1. Executive IQ production binding
2. Sales Funnel production binding
3. Rejection Funnel production binding
4. Live Assist partial-production design
5. Email Template Center app-owned schema and UI
6. Coaching Calendar app-owned schema and UI

## Safety rule

Use source schemas for read-only analytics. Use approved app-owned schema for new product data.
