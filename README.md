# Call Master Control Tower

Multi-phase HRMS Call Quality & Coaching Management System.

## Quick Start

### 1. SQL Setup
```bash
mysql -h HOST -u USER -p DB < sql/01_create_summary_table.sql
mysql -h HOST -u USER -p DB < sql/02_refresh_summary_table.sql  
mysql -h HOST -u USER -p DB < sql/03_validation_queries.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with DB credentials
npm install
npm run dev  # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

## Test Endpoints
```bash
curl http://localhost:5000/api/health/readiness
curl http://localhost:5000/api/processes
curl "http://localhost:5000/api/calls?processCode=FINNABLE"
curl -X POST http://localhost:5000/api/master/refresh-summary
```

## Key Rules
1. Never use `v_call_master_*` heavy views
2. `db_external` and `db_audit` are READ-ONLY
3. Only write to `Shivamgiri.cm_*` tables
4. Quote passwords with special chars: `DB_PASSWORD="pass!@#"`

## Features (7 Phases Complete)
- Phase 1: SQL + Basic APIs
- Phase 2: Role-based UI + Agent Summary
- Phase 3: Date filters + Export
- Phase 4: JWT Auth + RBAC
- Phase 5: Coaching + Audit 360
- Phase 6: Governance + LMS Sync
- Phase 7: Readiness + Refresh Summary

**See full API docs in backend/src/modules/**
