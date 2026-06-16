# Production Readiness Next Steps

## Current state

The portal shell, core modules, build workflow, and key backend routes are in place.

## Immediate validation

1. Build backend.
2. Build frontend.
3. Start backend.
4. Start frontend preview.
5. Open every portal page.
6. Validate source banners and fallback states.
7. Confirm database-backed pages return live data where credentials and table mappings are available.

## Pages to validate

- Executive IQ
- Sales Funnel
- Rejection Funnel
- Live Assist
- AI Studio
- Best Call Library
- SaaS Control
- Critical Insights
- Enterprise Readiness
- Email Template Center
- Coaching Calendar
- Client Portal

## API groups to validate

- health
- executive
- funnels
- live
- ai-studio
- library
- communications
- coaching-calendar
- saas

## Go-live rule

Do not mark production complete until backend build, frontend build, API smoke checks, browser checks, database credential checks, and source-state review are all completed.

## Remaining production build items

1. AI Studio framework binding.
2. AI Studio governance binding.
3. Best Call assignment endpoint.
4. SaaS tenant persistence.
5. Live Assist streaming gateway.
6. Client portal permission model.
7. Deployment runbook.
