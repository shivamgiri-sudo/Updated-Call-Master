# Phase 19 - SaaS Tenant Persistence and Client Portal Permission Model

## Completed

### SaaS tenant persistence

Added app-owned schema proposal:

- `cm_tenant_master`
- `cm_tenant_feature_flag`
- `cm_tenant_usage_daily`

Updated SaaS API behavior:

- `/api/saas/tenant-summary` now attempts app-owned tenant table first.
- `/api/saas/feature-flags` now attempts app-owned feature flag table first.
- Both routes retain safe demo fallback.

### Client Portal permission model

Added app-owned schema proposal:

- `cm_client_portal_role`
- `cm_client_portal_user`
- `cm_client_portal_permission`
- `cm_client_portal_share_log`

Added Client Portal API routes:

- `/api/client-portal/users`
- `/api/client-portal/permissions`
- `/api/client-portal/shares`
- `/api/client-portal/readiness`

The routes attempt app-owned tables first and fall back safely if tables or credentials are missing.

## Safety design

Client Portal permissions default to safe access:

- raw download is disabled by default
- view/export/comment permissions are explicit per role and module
- sharing is logged
- source databases remain read-only

## Validation steps

1. Apply `sql/phase19_saas_client_portal_tables.sql` in the app database.
2. Add one tenant row.
3. Add feature flags for the tenant.
4. Add portal roles.
5. Add portal users.
6. Add module permissions.
7. Start backend.
8. Validate `/api/saas/tenant-summary`.
9. Validate `/api/saas/feature-flags`.
10. Validate `/api/client-portal/users`.
11. Validate `/api/client-portal/permissions`.
12. Validate `/api/client-portal/shares`.

## Remaining work

- Add frontend API calls for Client Portal instead of static fallback.
- Add portal role management UI.
- Add share-link approval workflow.
- Add export watermarking.
- Add tenant usage aggregation job.
- Add audit log for portal access.
