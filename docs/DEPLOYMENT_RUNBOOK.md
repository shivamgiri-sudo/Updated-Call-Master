# Deployment Runbook

## Objective

Deploy Call Master Enterprise IQ safely after build and smoke validation.

## Environments

- Local development
- Staging
- Production

## Backend deployment steps

1. Pull latest code.
2. Configure backend environment variables.
3. Install dependencies.
4. Build backend.
5. Start backend process.
6. Verify health endpoint.
7. Verify core API groups.

## Frontend deployment steps

1. Configure API base URL.
2. Install dependencies.
3. Build frontend.
4. Serve generated frontend build using approved web server.
5. Open portal in browser.
6. Validate every module page.

## Database checks

- Confirm app database is writable only for approved app-owned tables.
- Confirm source databases are read-only.
- Confirm process/client mapping exists.
- Confirm fallback state is visible when live mapping is not available.

## Rollback plan

- Keep previous backend build artifact.
- Keep previous frontend build artifact.
- Revert deployment to previous artifact if health or core pages fail.
- Do not modify source database schemas during rollback.

## Required sign-off

- Engineering build validation
- QA smoke validation
- Operations page validation
- Business demo approval

## Known production gaps

- True Live Assist streaming is not fully implemented.
- Email Template Center still requires app-owned persistence.
- Coaching Calendar still requires app-owned schedule persistence.
- SaaS tenant isolation requires persistence model completion.
- Client Portal requires permission and sharing model.
