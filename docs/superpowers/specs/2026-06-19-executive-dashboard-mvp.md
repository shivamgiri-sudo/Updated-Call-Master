# Call Master Executive Dashboard — Production MVP Design

**Date:** 2026-06-19  
**Scope:** Complete vertical slice — Executive role dashboard with CDR integration, auth, and evidence drilldown  
**Approach:** Production-ready startup MVP — minimal but scalable, multi-tenant from day 1

---

## 1. Executive Summary

Build a production-grade BPO analytics platform starting with the Executive (CEO) dashboard as the first vertical slice. This proves the full stack works end-to-end: CDR data ingestion from 4 databases → backend API → JWT auth → React dashboard → call evidence drilldown.

**MVP Scope:**
- One role: Executive (CEO) — sees all processes/branches
- One dashboard: 6 KPIs + process scorecard + revenue chart + risk heatmap
- Call evidence drawer with transcript preview
- JWT auth with refresh tokens
- Multi-tenant ready (client_id scoping)
- Event-sourced audit trail

**Out of Scope for MVP:**
- Other 14 roles (add post-MVP)
- Sales/rejection funnels (add post-MVP)
- Quality parameter drilldowns (add post-MVP)
- Admin console (add post-MVP)
- Mobile app (API-first design makes this easy later)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (nginx)                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│  Frontend SPA  │                    │   Backend API   │
│  React + Vite  │◄──────────────────►│ Express + TS    │
│  Port 5173     │     JWT Auth       │  Port 5000      │
└────────────────┘                    └─────────┬───────┘
                                                │
                    ┌──────────────┬────────────┼────────────┬──────────────┐
                    │              │            │            │              │
            ┌───────▼──────┐ ┌────▼─────┐ ┌───▼─────┐ ┌───▼──────┐ ┌─────▼─────┐
            │ dialer_db    │ │Shivamgiri│ │db_external│ db_audit │ │  Redis    │
            │ (CDR source) │ │ (App DB) │ │(Read-only)│(Read-only)│ (Cache)   │
            │ MySQL 8.0    │ │ MySQL    │ │  MySQL    │  MySQL   │ │(Optional) │
            └──────────────┘ └──────────┘ └───────────┘ └──────────┘ └───────────┘
```

### 2.2 Data Flow

**Login Flow:**
```
User → Frontend → POST /api/v1/auth/login → Backend
                                           → Validate credentials
                                           → Generate JWT (24h access + 7d refresh)
                                           → Store refresh token in DB
                                           ← Return tokens + user profile
       ← Store tokens in memory (not localStorage for security)
```

**Dashboard Load Flow:**
```
User → Frontend → GET /api/v1/executive/summary?from=2026-06-01&to=2026-06-19
                  Headers: { Authorization: "Bearer <access_token>" }
                → Backend → Auth middleware (verify JWT)
                          → Extract user.client_id, user.process_codes
                          → Check in-memory cache (60s TTL)
                          → Cache miss → Query 4 databases in parallel:
                              • dialer_db.vw_inbound_cdr
                              • dialer_db.vw_outbound_cdr
                              • db_external.CallDetails
                              • db_audit (if needed)
                          → Map to CanonicalCall model
                          → Apply data scope filters (client_id, process_codes)
                          → Aggregate metrics
                          → Cache result
                          ← Return JSON
       ← Render dashboard
```

**Call Detail Drilldown Flow:**
```
User clicks row → Frontend → GET /api/v1/calls/abc-123-def
                           → Backend → Verify JWT + data scope
                                     → Query call by ID from source DB
                                     → Fetch transcript (if exists)
                                     → Audit: log VIEW event
                                     ← Return call detail + transcript
                ← Open drawer with evidence
```

### 2.3 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite | Fast HMR, modern tooling, type safety |
| UI Components | Custom (no library) | Zero bloat, existing dark theme, full control |
| Routing | react-router-dom v6 Hash | Static build compatibility |
| State | React Context + Hooks | Sufficient for dashboard, no Redux overhead |
| Backend | Node.js 20 + Express + TypeScript | Proven, massive ecosystem |
| Database | MySQL 8.0 (4 separate DBs) | Existing infrastructure |
| Auth | JWT (24h access + 7d refresh) | Stateless, scalable, mobile-ready |
| Cache | In-memory Map → Redis (phase 2) | Start simple, scale when needed |
| Logging | Winston + daily rotate | Structured JSON logs |
| Validation | Zod | Runtime type safety + OpenAPI generation |

---

## 3. Database Architecture

### 3.1 Four-Database Strategy

**1. `dialer_db` (CDR Source — READ-ONLY)**
- **Purpose:** Raw call detail records from Vicidial/GoAutoDial
- **Key Tables:**
  - `vw_inbound_cdr` — Inbound call records
  - `vw_outbound_cdr` — Outbound call records
- **Access:** Read-only connection pool (10 connections)
- **Security:** Never write to this database

**2. `Shivamgiri` (Application DB — READ-WRITE)**
- **Purpose:** Application-owned tables, summary caches, user data
- **Key Tables:**
  - `cm_users` — User accounts with RBAC
  - `cm_refresh_tokens` — JWT refresh tokens
  - `cm_executive_summary` — Pre-aggregated daily metrics
  - `cm_portal_audit` — Audit trail for all portal actions
  - `cm_cache_metadata` — Cache freshness tracking
- **Access:** Read-write connection pool (20 connections)
- **Security:** Only write to `cm_*` prefixed tables

**3. `db_external` (Legacy Audit — READ-ONLY)**
- **Purpose:** Legacy call audit data from Finnable Apps Script system
- **Key Tables:**
  - `CallDetails` — Audited call records with QA scores
- **Access:** Read-only connection pool (10 connections)
- **Security:** Never write to this database

**4. `db_audit` (Portal Audit — READ-ONLY for dashboard)**
- **Purpose:** Historical audit trail (can be written by separate audit service)
- **Access:** Read-only for dashboard queries (5 connections)

### 3.2 Connection Pool Configuration

```typescript
// config/database.ts
export const pools = {
  dialer: createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER_READONLY, // Separate read-only user
    password: process.env.DB_PASSWORD_READONLY,
    database: 'dialer_db',
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
  }),
  
  app: createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'Shivamgiri',
    connectionLimit: 20,
    queueLimit: 0,
    waitForConnections: true,
  }),
  
  external: createPool({
    host: process.env.DB_HOST_EXTERNAL,
    port: Number(process.env.DB_PORT_EXTERNAL),
    user: process.env.DB_USER_READONLY,
    password: process.env.DB_PASSWORD_READONLY,
    database: 'db_external',
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
  }),
  
  audit: createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER_READONLY,
    password: process.env.DB_PASSWORD_READONLY,
    database: 'db_audit',
    connectionLimit: 5,
    queueLimit: 0,
    waitForConnections: true,
  }),
};
```

### 3.3 Schema: `cm_users` (Application User Table)

```sql
CREATE TABLE cm_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  employee_code VARCHAR(50) UNIQUE,
  
  -- Profile
  full_name VARCHAR(255) NOT NULL,
  role ENUM(
    'CEO', 
    'PROCESS_HEAD', 
    'BRANCH_MANAGER', 
    'TL', 
    'QA_HEAD', 
    'ANALYST', 
    'AGENT'
  ) NOT NULL,
  
  -- Multi-tenant scope
  client_id INT NOT NULL,
  
  -- Data scope (NULL = see all)
  process_codes JSON COMMENT 'Array of process codes, e.g., ["FINNABLE", "INDIFI"]. NULL = all processes.',
  branch_codes JSON COMMENT 'Array of branch codes, e.g., ["MUMBAI", "DELHI"]. NULL = all branches.',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_employee (employee_code),
  INDEX idx_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example data
INSERT INTO cm_users (email, password_hash, employee_code, full_name, role, client_id, process_codes, branch_codes) VALUES
('ceo@example.com', '$2b$10$...', 'CEO001', 'Rajesh Kumar', 'CEO', 1, NULL, NULL), -- Sees all
('ph.finnable@example.com', '$2b$10$...', 'PH001', 'Priya Sharma', 'PROCESS_HEAD', 1, '["FINNABLE"]', NULL), -- Finnable only
('bm.mumbai@example.com', '$2b$10$...', 'BM001', 'Amit Patel', 'BRANCH_MANAGER', 1, '["FINNABLE"]', '["MUMBAI"]'); -- Mumbai only
```

**RBAC Rules:**
- `CEO`: `process_codes = NULL`, `branch_codes = NULL` → sees everything for their `client_id`
- `PROCESS_HEAD`: `process_codes = ["X"]`, `branch_codes = NULL` → sees one process, all branches
- `BRANCH_MANAGER`: `process_codes = ["X"]`, `branch_codes = ["Y"]` → sees one process, one branch
- `TL`/`AGENT`: Additional `team_id` scope (add in phase 2)

### 3.4 Schema: `cm_refresh_tokens`

```sql
CREATE TABLE cm_refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL COMMENT 'SHA256 hash of refresh token',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES cm_users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Security:**
- Store SHA256 hash of refresh token, not plaintext
- Expire after 7 days
- Rotate on every use (delete old, issue new)
- Cleanup expired tokens daily via cron

### 3.5 Schema: `cm_executive_summary` (Pre-Aggregated Metrics)

```sql
CREATE TABLE cm_executive_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Dimensions
  snapshot_date DATE NOT NULL,
  process_code VARCHAR(50) NOT NULL,
  branch_code VARCHAR(50),
  client_id INT NOT NULL,
  
  -- Call volume
  total_calls INT DEFAULT 0,
  inbound_calls INT DEFAULT 0,
  outbound_calls INT DEFAULT 0,
  connected_calls INT DEFAULT 0,
  
  -- Outcomes
  conversion_count INT DEFAULT 0,
  rejection_count INT DEFAULT 0,
  
  -- Averages
  avg_talk_time_seconds DECIMAL(10,2),
  avg_hold_time_seconds DECIMAL(10,2),
  avg_conversion_rate DECIMAL(5,2),
  avg_qa_score DECIMAL(5,2),
  
  -- Revenue (if available)
  total_revenue DECIMAL(15,2),
  
  -- Risk flags
  critical_errors_count INT DEFAULT 0,
  compliance_violations_count INT DEFAULT 0,
  
  -- Metadata
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_snapshot (snapshot_date, process_code, branch_code, client_id),
  INDEX idx_date (snapshot_date),
  INDEX idx_process (process_code),
  INDEX idx_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Refresh Strategy:**
- Cron job refreshes daily at 2 AM
- API endpoint `POST /api/v1/cache/refresh` for manual refresh (admin only)
- TTL: Current day = 5 minutes, historical days = 24 hours

### 3.6 Schema: `cm_portal_audit`

```sql
CREATE TABLE cm_portal_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  
  -- Who
  user_id INT NOT NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  
  -- What
  event_type ENUM('VIEW', 'EXPORT', 'EDIT', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
  resource_type VARCHAR(50) NOT NULL COMMENT 'CALL, DASHBOARD, REPORT, USER',
  resource_id VARCHAR(255) COMMENT 'ID of the resource accessed',
  
  -- How
  request_path VARCHAR(500),
  request_method VARCHAR(10),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Export-specific
  watermark_applied BOOLEAN DEFAULT FALSE,
  export_format VARCHAR(20) COMMENT 'PDF, CSV, XLSX',
  row_count INT COMMENT 'Number of records exported',
  
  -- When
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_event (event_type),
  INDEX idx_created (created_at),
  INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Audit Events:**
- `LOGIN` — User logged in
- `VIEW` — User viewed dashboard/call detail
- `EXPORT` — User exported data (always watermarked)
- `EDIT` — User edited configuration (future)
- `DELETE` — User deleted something (future)

---

## 4. Canonical Call Model

### 4.1 Unified Interface

All CDR sources map to this unified schema:

```typescript
interface CanonicalCall {
  // Identity
  id: string;                          // UUID v4 (generated)
  source: 'dialer_inbound' | 'dialer_outbound' | 'external' | 'audit';
  source_id: string;                   // Original table primary key
  source_table: string;                // e.g., "vw_inbound_cdr"
  
  // Timestamps
  call_date: string;                   // YYYY-MM-DD
  call_time: string;                   // HH:MM:SS
  call_datetime: Date;                 // Combined for sorting
  
  // Participants
  client_id: number;
  process_code: string;
  branch_code: string | null;
  agent_code: string;
  agent_name: string;
  customer_phone: string;              // Masked: XXX-XXX-1234
  
  // Call flow
  direction: 'inbound' | 'outbound';
  campaign_name?: string;
  list_id?: string;
  lead_id?: string;
  
  // Outcome
  disposition: string;                 // Sale, Not Interested, Callback, etc.
  status: string;                      // Connected, No Answer, Busy, Failed
  sub_status?: string;
  
  // Metrics (all in seconds)
  duration: number;                    // Total call duration
  talk_time: number;                   // Actual talk time
  hold_time: number;                   // Time on hold
  wait_time?: number;                  // Queue wait (inbound only)
  ring_time?: number;
  
  // Quality (nullable — only if audited)
  qa_score?: number;                   // 0-100
  qa_auditor_code?: string;
  qa_auditor_name?: string;
  qa_date?: string;                    // YYYY-MM-DD
  qa_parameters?: QAParameter[];       // Detailed scoring
  fatal_errors?: string[];             // Critical violations
  
  // Evidence
  recording_url?: string;
  transcript?: string;                 // Full transcript
  notes?: string;
  
  // Metadata
  created_at: Date;
  indexed_at: Date;                    // When ingested into system
}

interface QAParameter {
  category: string;                    // Greeting, Pitch, Objection Handling, etc.
  parameter: string;
  score: number;
  max_score: number;
  is_fatal: boolean;
  remarks?: string;
}
```

### 4.2 Source Mappers

Each CDR source has a dedicated mapper:

**Dialer Inbound Mapper:**
```typescript
function mapDialerInboundCDR(row: any): CanonicalCall {
  return {
    id: uuidv4(),
    source: 'dialer_inbound',
    source_id: String(row.uniqueid),
    source_table: 'vw_inbound_cdr',
    
    call_date: row.call_date,
    call_time: row.call_time,
    call_datetime: new Date(`${row.call_date} ${row.call_time}`),
    
    client_id: row.client_id || 1,
    process_code: row.campaign || 'UNKNOWN',
    branch_code: row.location || null,
    agent_code: row.user || 'SYSTEM',
    agent_name: row.agent_name || row.user,
    customer_phone: maskPhone(row.phone_number),
    
    direction: 'inbound',
    campaign_name: row.campaign,
    
    disposition: row.status || 'UNKNOWN',
    status: mapDialerStatus(row.status),
    
    duration: Number(row.length_in_sec) || 0,
    talk_time: Number(row.length_in_sec) || 0,
    hold_time: 0, // Calculate from queue_seconds if available
    wait_time: Number(row.queue_seconds) || 0,
    
    created_at: new Date(`${row.call_date} ${row.call_time}`),
    indexed_at: new Date(),
  };
}
```

**Dialer Outbound Mapper:**
```typescript
function mapDialerOutboundCDR(row: any): CanonicalCall {
  return {
    id: uuidv4(),
    source: 'dialer_outbound',
    source_id: String(row.uniqueid),
    source_table: 'vw_outbound_cdr',
    
    call_date: row.call_date,
    call_time: row.call_time,
    call_datetime: new Date(`${row.call_date} ${row.call_time}`),
    
    client_id: row.client_id || 1,
    process_code: row.campaign || 'UNKNOWN',
    branch_code: row.location || null,
    agent_code: row.user || 'SYSTEM',
    agent_name: row.full_name || row.user,
    customer_phone: maskPhone(row.phone_number),
    
    direction: 'outbound',
    campaign_name: row.campaign,
    list_id: String(row.list_id),
    lead_id: String(row.lead_id),
    
    disposition: row.status || 'UNKNOWN',
    status: mapDialerStatus(row.status),
    
    duration: Number(row.length_in_sec) || 0,
    talk_time: Number(row.length_in_sec) || 0,
    hold_time: 0,
    
    created_at: new Date(`${row.call_date} ${row.call_time}`),
    indexed_at: new Date(),
  };
}
```

**External CDR Mapper (Finnable Legacy):**
```typescript
function mapExternalCDR(row: any): CanonicalCall {
  return {
    id: uuidv4(),
    source: 'external',
    source_id: String(row.id),
    source_table: 'CallDetails',
    
    call_date: row.CallDate,
    call_time: row.CallTime,
    call_datetime: new Date(`${row.CallDate} ${row.CallTime}`),
    
    client_id: row.client_id,
    process_code: row.Campaign || 'FINNABLE',
    branch_code: row.Location,
    agent_code: row.AgentCode,
    agent_name: row.AgentName,
    customer_phone: maskPhone(row.CustomerMobile),
    
    direction: row.CallType === 'Inbound' ? 'inbound' : 'outbound',
    
    disposition: row.Disposition,
    status: row.CallStatus,
    
    duration: Number(row.CallDuration) || 0,
    talk_time: Number(row.TalkTime) || 0,
    hold_time: Number(row.HoldTime) || 0,
    
    // QA data (if audited)
    qa_score: row.QAScore ? Number(row.QAScore) : undefined,
    qa_auditor_code: row.AuditorCode || undefined,
    qa_auditor_name: row.AuditorName || undefined,
    qa_date: row.AuditDate || undefined,
    
    recording_url: row.RecordingURL,
    transcript: row.Transcript,
    notes: row.Remarks,
    
    created_at: new Date(`${row.CallDate} ${row.CallTime}`),
    indexed_at: new Date(),
  };
}
```

### 4.3 Phone Masking

```typescript
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return 'XXXX';
  const last4 = phone.slice(-4);
  return `XXX-XXX-${last4}`;
}
```

**Security:** Never expose full phone numbers in API responses or logs. CEO role sees masked numbers. Only QA/Compliance roles see unmasked (add in phase 2).

---

## 5. API Design

### 5.1 Authentication Endpoints

#### `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "ceo@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_abc123...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "email": "ceo@example.com",
      "fullName": "Rajesh Kumar",
      "role": "CEO",
      "clientId": 1,
      "processCodes": null,
      "branchCodes": null
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**JWT Payload:**
```json
{
  "sub": "1",
  "email": "ceo@example.com",
  "role": "CEO",
  "clientId": 1,
  "processCodes": null,
  "branchCodes": null,
  "iat": 1719417600,
  "exp": 1719504000
}
```

**Rate Limiting:** 5 attempts per 15 minutes per IP

#### `POST /api/v1/auth/refresh`

**Request:**
```json
{
  "refreshToken": "refresh_abc123..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_def456...",  // New refresh token (rotation)
    "expiresIn": 86400
  }
}
```

#### `POST /api/v1/auth/logout`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refreshToken": "refresh_abc123..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Action:** Delete refresh token from database.

#### `GET /api/v1/auth/me`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "ceo@example.com",
    "fullName": "Rajesh Kumar",
    "role": "CEO",
    "clientId": 1,
    "processCodes": null,
    "branchCodes": null,
    "lastLoginAt": "2026-06-19T10:30:00Z"
  }
}
```

### 5.2 Executive Dashboard Endpoints

#### `GET /api/v1/executive/summary`

**Query Parameters:**
- `from` (required): YYYY-MM-DD
- `to` (required): YYYY-MM-DD
- `processCode` (optional): Filter by process
- `branchCode` (optional): Filter by branch

**Request:**
```
GET /api/v1/executive/summary?from=2026-06-01&to=2026-06-19&processCode=FINNABLE
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalCalls": 15420,
      "totalRevenue": 8945000,
      "avgConversion": 12.4,
      "avgQuality": 78.3,
      "criticalInsights": 3,
      "activeRisks": 2,
      "trends": {
        "calls": { "value": 8.2, "direction": "up" },
        "revenue": { "value": 15.3, "direction": "up" },
        "conversion": { "value": -2.1, "direction": "down" },
        "quality": { "value": 3.5, "direction": "up" }
      }
    },
    "dateRange": {
      "from": "2026-06-01",
      "to": "2026-06-19"
    },
    "filters": {
      "processCode": "FINNABLE",
      "branchCode": null
    },
    "refreshedAt": "2026-06-19T10:45:00Z"
  }
}
```

**Cache Strategy:**
- Key: `executive:summary:${userId}:${from}:${to}:${processCode}:${branchCode}`
- TTL: 60 seconds
- Invalidate on manual refresh

#### `GET /api/v1/executive/process-scorecard`

**Query Parameters:** Same as `/summary`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "processes": [
      {
        "processCode": "FINNABLE",
        "processName": "Finnable Loans",
        "branches": [
          {
            "branchCode": "MUMBAI",
            "branchName": "Mumbai Branch",
            "calls": 8540,
            "connected": 7832,
            "conversion": 13.2,
            "rejection": 24.5,
            "quality": 81.2,
            "revenue": 4820000,
            "risk": "medium"
          },
          {
            "branchCode": "DELHI",
            "branchName": "Delhi NCR",
            "calls": 6880,
            "connected": 6234,
            "conversion": 11.8,
            "rejection": 28.3,
            "quality": 75.6,
            "revenue": 4125000,
            "risk": "high"
          }
        ],
        "totals": {
          "calls": 15420,
          "connected": 14066,
          "conversion": 12.6,
          "rejection": 26.2,
          "quality": 78.7,
          "revenue": 8945000,
          "risk": "medium"
        }
      }
    ]
  }
}
```

**Risk Calculation:**
- `low`: Quality > 85, Conversion > 15%
- `medium`: Quality 70-85 OR Conversion 10-15%
- `high`: Quality < 70 OR Conversion < 10%
- `critical`: Quality < 60 OR Conversion < 5%

#### `GET /api/v1/executive/revenue-forecast`

**Query Parameters:** Same as `/summary`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "current": {
      "revenue": 8945000,
      "conversions": 1945,
      "avgTicket": 4600
    },
    "forecast": {
      "monthly": 14200000,
      "quarterly": 42600000,
      "confidence": "medium"
    },
    "assumptions": {
      "avgTicketSize": 4600,
      "conversionRate": 12.6,
      "avgCallsPerDay": 810,
      "workingDays": 22
    }
  }
}
```

**Formula:**
```
Monthly Revenue = (Avg Calls/Day × Working Days × Conversion Rate × Avg Ticket)
```

### 5.3 Call Detail Endpoints

#### `GET /api/v1/calls`

**Query Parameters:**
- `from` (required): YYYY-MM-DD
- `to` (required): YYYY-MM-DD
- `processCode` (optional)
- `branchCode` (optional)
- `agentCode` (optional)
- `disposition` (optional)
- `minDuration` (optional): seconds
- `maxDuration` (optional): seconds
- `page` (default: 1)
- `limit` (default: 50, max: 200)

**Request:**
```
GET /api/v1/calls?from=2026-06-19&to=2026-06-19&processCode=FINNABLE&page=1&limit=50
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "calls": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "callDate": "2026-06-19",
        "callTime": "10:34:12",
        "direction": "outbound",
        "processCode": "FINNABLE",
        "branchCode": "MUMBAI",
        "agentCode": "AGT001",
        "agentName": "Amit Sharma",
        "customerPhone": "XXX-XXX-1234",
        "disposition": "Sale",
        "status": "Connected",
        "duration": 420,
        "talkTime": 395,
        "qaScore": 82,
        "hasRecording": true,
        "hasTranscript": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1245,
      "pages": 25
    }
  }
}
```

#### `GET /api/v1/calls/:callId`

**Request:**
```
GET /api/v1/calls/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "source": "dialer_outbound",
    "sourceId": "1234567890.123",
    "callDate": "2026-06-19",
    "callTime": "10:34:12",
    "direction": "outbound",
    "processCode": "FINNABLE",
    "branchCode": "MUMBAI",
    "agentCode": "AGT001",
    "agentName": "Amit Sharma",
    "customerPhone": "XXX-XXX-1234",
    "campaignName": "Finnable June Campaign",
    "disposition": "Sale",
    "status": "Connected",
    "duration": 420,
    "talkTime": 395,
    "holdTime": 25,
    "qaScore": 82,
    "qaAuditorName": "Priya QA",
    "qaDate": "2026-06-19",
    "qaParameters": [
      {
        "category": "Opening",
        "parameter": "Greeting",
        "score": 10,
        "maxScore": 10,
        "isFatal": false
      },
      {
        "category": "Pitch",
        "parameter": "Product Knowledge",
        "score": 8,
        "maxScore": 10,
        "isFatal": false
      }
    ],
    "recordingUrl": "https://recordings.example.com/abc123.mp3",
    "transcript": "Agent: Good morning, this is Amit from Finnable...",
    "notes": "Customer was interested in personal loan"
  }
}
```

**Audit:** Every call detail view is logged to `cm_portal_audit` with event_type=`VIEW`.

### 5.4 Health & Metrics Endpoints

#### `GET /api/v1/health`

**Response (200 OK):**
```json
{
  "success": true,
  "service": "Call Master Enterprise API",
  "version": "1.0.0",
  "status": "healthy",
  "timestamp": "2026-06-19T10:45:00Z",
  "uptime": 345600,
  "databases": {
    "dialer": "connected",
    "app": "connected",
    "external": "connected",
    "audit": "connected"
  }
}
```

#### `GET /api/v1/metrics` (Admin only)

**Response (200 OK):**
```text
# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",route="/api/v1/executive/summary",status="200"} 1523

# HELP api_request_duration_seconds API request duration
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{le="0.1"} 845
api_request_duration_seconds_bucket{le="0.5"} 1420
api_request_duration_seconds_bucket{le="1.0"} 1510
```

---

## 6. Frontend Architecture

### 6.1 Component Hierarchy

```
App
├── AuthProvider (Context)
├── Routes
    ├── LoginPage
    ├── ProtectedRoute
        └── AppShell
            ├── Sidebar
            ├── Topbar
            └── <Page>
                ├── ExecutivePage
                │   ├── ExecutiveKPIs (6 KpiCards)
                │   ├── ProcessScorecard (DataTable)
                │   ├── RevenueChart (BarChart)
                │   └── RiskHeatmap (custom grid)
                ├── QualityPage
                ├── SalesFunnelPage
                └── ...
```

### 6.2 State Management

**AuthContext:**
```typescript
interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

**No global dashboard state** — each page manages its own data via `usePageData` hook with 60s cache.

### 6.3 Data Fetching Pattern

**`usePageData` Hook:**
```typescript
function usePageData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; retry?: boolean }
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
```

**Example Usage:**
```typescript
function ExecutivePage() {
  const { data, loading, error, refresh } = usePageData(
    'executive-summary-2026-06-01-2026-06-19',
    () => executiveApi.getSummary({ from: '2026-06-01', to: '2026-06-19' }),
    { ttl: 60_000 }
  );

  if (loading) return <LoadingGrid />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return <ExecutiveDashboard data={data} />;
}
```

### 6.4 Call Evidence Drawer

**Design:**
- Slide-out drawer from right (80% viewport width on desktop, 100% on mobile)
- Sections: Call Info | Timeline | Transcript | QA Scorecard | Recording Player
- Close on ESC key or backdrop click
- Deep linkable: `#/calls/abc-123-def` opens drawer directly

**Implementation:**
```typescript
interface CallDrawerProps {
  callId: string | null;
  onClose: () => void;
}

function CallDrawer({ callId, onClose }: CallDrawerProps) {
  const { data, loading } = usePageData(
    `call-detail-${callId}`,
    () => callsApi.getCallDetail(callId!),
    { ttl: 300_000 } // 5 min cache (call details don't change)
  );

  if (!callId) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        {loading ? <Spinner /> : <CallDetailView call={data} />}
      </div>
    </div>
  );
}
```

### 6.5 Responsive Breakpoints

```css
/* Mobile first */
:root {
  --sidebar-width: 240px;
  --topbar-height: 64px;
}

/* Tablet: 768px+ */
@media (max-width: 768px) {
  .sidebar { display: none; } /* Hamburger menu */
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Large desktop: 1440px+ */
@media (min-width: 1440px) {
  .kpi-grid { grid-template-columns: repeat(6, 1fr); }
}
```

---

## 7. Security Model

### 7.1 Authentication Flow

**Token Storage:**
- Access token: In-memory only (no localStorage)
- Refresh token: HttpOnly cookie (future) OR in-memory with expiry check

**Why not localStorage?**
- XSS vulnerability — malicious script can steal tokens
- In-memory tokens are cleared on page refresh (requires re-login, but more secure for enterprise)

**Silent Refresh:**
- 5 minutes before access token expires, frontend calls `/auth/refresh` in background
- If refresh fails → redirect to login

### 7.2 Data Scope Enforcement

**Backend Middleware:**
```typescript
function enforceDataScope(req: AuthRequest, filters: any): any {
  const { user } = req;
  
  // Apply client_id scope (always)
  filters.client_id = user.clientId;
  
  // Apply process scope (if restricted)
  if (user.processCodes && user.processCodes.length > 0) {
    filters.process_code = { $in: user.processCodes };
  }
  
  // Apply branch scope (if restricted)
  if (user.branchCodes && user.branchCodes.length > 0) {
    filters.branch_code = { $in: user.branchCodes };
  }
  
  return filters;
}
```

**Frontend Behavior:**
- CEO: Process/branch filters are optional (can see all)
- Process Head: Process filter is pre-selected and disabled
- Branch Manager: Process + branch filters are pre-selected and disabled

### 7.3 SQL Injection Prevention

**Use parameterized queries ONLY:**
```typescript
// ✅ SAFE
const sql = 'SELECT * FROM calls WHERE client_id = ? AND call_date >= ?';
const [rows] = await pool.query(sql, [clientId, fromDate]);

// ❌ DANGEROUS
const sql = `SELECT * FROM calls WHERE client_id = ${clientId}`;
```

**For dynamic identifiers (table names, column names):**
```typescript
import { qid } from '../utils/qid';

const tableName = qid('vw_outbound_cdr'); // Validates + escapes
const sql = `SELECT * FROM ${tableName} WHERE client_id = ?`;
```

### 7.4 Rate Limiting

**Per-User Limits:**
- Login: 5 attempts per 15 minutes
- API calls: 100 requests per minute per user
- Export: 10 exports per hour

**Implementation:**
```typescript
// In-memory Map for MVP, Redis in production
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const key = `${req.user.id}:${req.path}`;
    const now = Date.now();
    const limit = rateLimits.get(key);
    
    if (!limit || now > limit.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
      });
    }
    
    limit.count++;
    next();
  };
}
```

### 7.5 Export Watermarking

**Every export includes:**
- User email
- Export timestamp
- Client ID
- "Confidential — For Authorized Use Only"
- Row-level watermark (random UUID embedded in data)

**CSV Example:**
```csv
# Exported by: ceo@example.com on 2026-06-19 10:45:00 UTC
# Client ID: 1 | Export ID: 550e8400-e29b-41d4-a716-446655440000
# CONFIDENTIAL — FOR AUTHORIZED USE ONLY
Call Date,Agent,Disposition,Duration,Revenue
2026-06-19,Amit Sharma,Sale,420,5000
```

**PDF/Excel:** Same metadata in header/footer.

---

## 8. Scalability Considerations

### 8.1 Database Optimization

**Indexes (MVP):**
```sql
-- dialer_db.vw_inbound_cdr (if we can alter views)
CREATE INDEX idx_call_date_client ON vw_inbound_cdr(call_date, client_id);

-- dialer_db.vw_outbound_cdr
CREATE INDEX idx_call_date_client ON vw_outbound_cdr(call_date, client_id);

-- db_external.CallDetails
CREATE INDEX idx_call_date_client ON CallDetails(CallDate, client_id);
```

**Query Optimization:**
- Always include `client_id` in WHERE clause
- Date range queries: `call_date BETWEEN ? AND ?`
- Avoid `SELECT *` — specify columns
- Use `LIMIT` on all list queries

**Connection Pool Tuning:**
- Start: 10 connections per read-only DB, 20 for app DB
- Monitor: `SHOW PROCESSLIST` for connection usage
- Scale: Increase `connectionLimit` if pool exhaustion occurs

### 8.2 Caching Strategy

**In-Memory Cache (MVP):**
```typescript
const cache = new Map<string, { data: any; expiresAt: number }>();

function get(key: string): any | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function set(key: string, data: any, ttl: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}
```

**Redis (Phase 2):**
- Same API, swap implementation
- Supports multi-node deployment
- Persistent cache across server restarts

**Cache Keys:**
```
executive:summary:{userId}:{from}:{to}:{processCode}:{branchCode}
call:detail:{callId}
user:profile:{userId}
```

**TTL Strategy:**
- Dashboard summaries: 60 seconds
- Call details: 5 minutes
- User profiles: 15 minutes
- Historical data (>7 days old): 24 hours

### 8.3 Horizontal Scaling

**Stateless API:**
- No in-process session state (JWT is stateless)
- In-memory cache is OK for MVP (each node has its own cache)
- Phase 2: Redis for shared cache

**Load Balancer:**
```nginx
upstream call_master_api {
  server 192.168.10.10:5000;
  server 192.168.10.11:5000;
  server 192.168.10.12:5000;
}

server {
  listen 80;
  location /api/ {
    proxy_pass http://call_master_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

**Database Read Replicas (Future):**
- Master: Write operations (`cm_*` tables)
- Replica 1: Executive/dashboard queries
- Replica 2: Call detail/export queries

### 8.4 Monitoring

**Key Metrics:**
- API response time (p50, p95, p99)
- Database query time per endpoint
- Cache hit rate
- Active connections per pool
- Error rate per endpoint
- Authentication success/failure rate

**Health Checks:**
- `/api/v1/health` — Overall health
- `/api/v1/health/db` — Per-database connection test
- `/api/v1/health/cache` — Cache service status

**Alerting Triggers:**
- Response time p95 > 2 seconds
- Error rate > 5% for any endpoint
- Database connection pool > 80% utilization
- Disk space > 85%

---

## 9. Deployment Strategy

### 9.1 Environment Configuration

**`.env.example`:**
```bash
# Server
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Database - Dialer
DB_DIALER_HOST=192.168.10.42
DB_DIALER_PORT=3306
DB_DIALER_USER=root
DB_DIALER_PASSWORD=vicidialnow
DB_DIALER_NAME=dialer_db

# Database - Application
DB_APP_HOST=192.168.10.42
DB_APP_PORT=3306
DB_APP_USER=shivamg
DB_APP_PASSWORD=Veer@321
DB_APP_NAME=Shivamgiri

# Database - External (Legacy)
DB_EXTERNAL_HOST=122.184.128.90
DB_EXTERNAL_PORT=3306
DB_EXTERNAL_USER=shivam_user
DB_EXTERNAL_PASSWORD=<password>
DB_EXTERNAL_NAME=db_external

# Database - Audit
DB_AUDIT_HOST=192.168.10.42
DB_AUDIT_PORT=3306
DB_AUDIT_USER=shivamg
DB_AUDIT_PASSWORD=Veer@321
DB_AUDIT_NAME=db_audit

# JWT
JWT_SECRET=<generate-random-64-char-string>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://callmaster.example.com

# Cache
CACHE_DEFAULT_TTL=60000
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Never commit `.env` to git.** Add `.env` to `.gitignore`.

### 9.2 Build Process

**Backend:**
```bash
cd backend
npm install
npm run build  # TypeScript → dist/
node dist/server.js
```

**Frontend:**
```bash
cd frontend
npm install
npm run build  # Vite → dist/
# Serve dist/ via nginx or Express static
```

### 9.3 Database Migrations

**Run on first deploy:**
```bash
mysql -h 192.168.10.42 -u shivamg -p'Veer@321' Shivamgiri < backend/sql/schema/001_create_users.sql
mysql -h 192.168.10.42 -u shivamg -p'Veer@321' Shivamgiri < backend/sql/schema/002_create_summary_tables.sql
mysql -h 192.168.10.42 -u shivamg -p'Veer@321' Shivamgiri < backend/sql/schema/003_create_indexes.sql
```

**Future migrations:** Use a migration tool like `db-migrate` or `Flyway`.

### 9.4 Process Manager (Production)

**PM2:**
```bash
npm install -g pm2
pm2 start dist/server.js --name call-master-api -i 4  # 4 instances
pm2 startup
pm2 save
```

**Systemd (alternative):**
```ini
[Unit]
Description=Call Master API
After=network.target

[Service]
Type=simple
User=callmaster
WorkingDirectory=/opt/call-master/backend
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### 9.5 Nginx (Static Frontend + API Proxy)

```nginx
server {
  listen 80;
  server_name callmaster.example.com;

  # Frontend static files
  root /opt/call-master/frontend/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # API proxy
  location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Backend:**
- Services: Mock repositories, test business logic
- Repositories: Mock database pool, test SQL generation
- Utilities: Test formatters, validators, qid escaping

**Frontend:**
- Components: Test rendering, event handlers
- Hooks: Test data fetching, caching, error states
- API clients: Mock axios, test request/response handling

**Tools:** Jest + Supertest (backend), Vitest + React Testing Library (frontend)

### 10.2 Integration Tests

**Backend:**
- Test real database queries against test database
- Test auth flow (login → access protected endpoint → refresh → logout)
- Test data scope enforcement (CEO sees all, Process Head sees subset)

**Example:**
```typescript
describe('Executive Summary API', () => {
  it('should return summary for CEO (all processes)', async () => {
    const token = await loginAs('ceo@example.com');
    const res = await request(app)
      .get('/api/v1/executive/summary?from=2026-06-01&to=2026-06-19')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(res.body.data.kpis.totalCalls).toBeGreaterThan(0);
  });

  it('should filter by process for Process Head', async () => {
    const token = await loginAs('ph.finnable@example.com');
    const res = await request(app)
      .get('/api/v1/executive/summary?from=2026-06-01&to=2026-06-19')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    // Process Head should only see FINNABLE data
    expect(res.body.data.filters.processCode).toBe('FINNABLE');
  });
});
```

### 10.3 E2E Tests

**Tool:** Playwright

**Scenarios:**
1. Login as CEO → Navigate to Executive Dashboard → Verify KPIs load
2. Click on process row → Call drawer opens → Verify transcript displays
3. Export data → Verify watermark in downloaded file
4. Logout → Verify redirect to login page

### 10.4 Load Testing

**Tool:** k6

**Test Plan:**
- 100 concurrent users
- 60-second ramp-up
- 300-second sustained load
- Endpoints: Login, Executive Summary, Call List

**Success Criteria:**
- p95 response time < 2 seconds
- Error rate < 1%
- No database connection pool exhaustion

---

## 11. MVP Feature Checklist

### Backend (Phase 1)

- [ ] Database connection pools (4 databases)
- [ ] User authentication (login, refresh, logout)
- [ ] JWT middleware with data scope enforcement
- [ ] Executive summary API
- [ ] Process scorecard API
- [ ] Revenue forecast API
- [ ] Call list API with pagination
- [ ] Call detail API
- [ ] Audit logging middleware
- [ ] Rate limiting middleware
- [ ] Health check endpoints
- [ ] Error handling middleware
- [ ] Logging with Winston

### Frontend (Phase 1)

- [ ] Login page
- [ ] Auth context with JWT management
- [ ] Protected routes
- [ ] App shell (Sidebar + Topbar)
- [ ] Executive dashboard page
  - [ ] 6 KPI cards with trends
  - [ ] Process scorecard table
  - [ ] Revenue bar chart
  - [ ] Risk heatmap
- [ ] Call evidence drawer
  - [ ] Call info section
  - [ ] Transcript viewer
  - [ ] QA scorecard (if available)
- [ ] Loading states
- [ ] Error states
- [ ] Responsive design (mobile + tablet + desktop)

### Database (Phase 1)

- [ ] Create `cm_users` table
- [ ] Create `cm_refresh_tokens` table
- [ ] Create `cm_executive_summary` table
- [ ] Create `cm_portal_audit` table
- [ ] Create indexes on date + client_id
- [ ] Seed test users (CEO, Process Head, Branch Manager)

### DevOps (Phase 1)

- [ ] `.env.example` with all required variables
- [ ] README with setup instructions
- [ ] Database migration scripts
- [ ] npm scripts for dev/build/start
- [ ] PM2 ecosystem file
- [ ] Nginx config example

---

## 12. Post-MVP Roadmap

### Phase 2: Additional Roles
- Process Head dashboard
- Branch Manager dashboard
- Team Leader dashboard
- Agent dashboard

### Phase 3: Quality Management
- QA Head dashboard
- Parameter failure drilldowns
- Fatal error tracking
- Auditor consistency reports
- Coaching impact tracking

### Phase 4: Funnels
- Sales transition funnel (15 stages)
- Rejection transition funnel (16 stages)
- Leakage analysis
- Agent-level funnel drilldowns

### Phase 5: Admin Console
- User management (CRUD)
- Role assignment
- Process/branch mapping
- System configuration
- Cache management

### Phase 6: Real-Time Features
- Live call monitoring
- Real-time agent status
- WebSocket for live updates
- Push notifications

### Phase 7: Mobile App
- React Native app
- Offline support
- Push notifications
- Biometric login

---

## 13. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Database performance degrades at scale | Medium | High | Add indexes, summary tables, read replicas |
| External DB (`db_external`) is unavailable | Medium | Medium | Graceful degradation, fallback to other sources |
| JWT token theft | Low | Critical | Short expiry (24h), refresh rotation, in-memory storage |
| Rate limiting bypassed | Low | Medium | IP + user-based limits, Redis for distributed tracking |
| CDR schema changes break mappers | High | High | Automated schema validation on app start, alerts |
| Cache invalidation bugs | Medium | Low | Short TTL (60s), manual refresh endpoint |

---

## 14. Success Metrics

### Technical Metrics
- API response time p95 < 2 seconds
- Database query time p95 < 500ms
- Cache hit rate > 70%
- Uptime > 99.5%
- Error rate < 0.5%

### Business Metrics
- CEO dashboard loads in < 3 seconds
- Call detail opens in < 1 second
- Export completes in < 10 seconds for 1000 rows
- Zero unauthorized data access incidents
- 100% audit trail coverage for sensitive operations

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **CDR** | Call Detail Record — raw call metadata from dialer |
| **Canonical Call** | Unified call model normalized across all CDR sources |
| **Data Scope** | RBAC constraint limiting user to specific processes/branches |
| **Evidence Drawer** | Slide-out panel showing call transcript, recording, QA score |
| **Process** | Business process (e.g., Finnable, Indifi, Upwards) |
| **Branch** | Physical location (e.g., Mumbai, Delhi) |
| **QA Score** | Quality assurance score (0-100) from call audit |
| **Fatal Error** | Critical QA violation (e.g., no greeting, hung up on customer) |
| **Watermark** | Embedded metadata in exports for audit trail |

---

## Appendix A: Sample Data

### Sample User

```sql
INSERT INTO cm_users (email, password_hash, employee_code, full_name, role, client_id, process_codes, branch_codes) VALUES
('ceo@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'CEO001', 'Rajesh Kumar', 'CEO', 1, NULL, NULL);
```

**Test Credentials:**
- Email: `ceo@example.com`
- Password: `Admin@123` (hash this with bcrypt)

### Sample Executive Summary Row

```sql
INSERT INTO cm_executive_summary 
(snapshot_date, process_code, branch_code, client_id, total_calls, inbound_calls, outbound_calls, connected_calls, conversion_count, rejection_count, avg_talk_time_seconds, avg_conversion_rate, avg_qa_score, total_revenue)
VALUES
('2026-06-19', 'FINNABLE', 'MUMBAI', 1, 450, 180, 270, 412, 56, 98, 385.5, 12.4, 78.3, 258000);
```

---

## Appendix B: Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired |
| `AUTH_TOKEN_INVALID` | 401 | Malformed or invalid token |
| `AUTH_UNAUTHORIZED` | 403 | User lacks permission for resource |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `DATABASE_ERROR` | 500 | Database query failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

**End of Specification**
