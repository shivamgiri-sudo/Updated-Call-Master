# Call Master Control Tower - UAT Test Cases

**Version:** Phase 1-9  
**Environment:** Staging  
**Test Date:** [To be filled during UAT]  
**Tester:** [To be filled during UAT]

## Test Environment Setup

**Staging URL:** https://staging.yourdomain.com  
**Backend API:** https://staging.yourdomain.com/api

**Test Users:**
| Role | Username | Process Access |
|------|----------|----------------|
| Admin | admin@test.com | All processes |
| T&Q Head | tqhead@test.com | All processes |
| QA Auditor | qa@test.com | FINNABLE |
| Trainer | trainer@test.com | FINNABLE |
| TL | tl@test.com | FINNABLE |

## Test Case Format

Each test case includes:
- **ID:** Unique identifier
- **Priority:** Critical / High / Medium / Low
- **Steps:** Numbered steps to execute
- **Expected Result:** What should happen
- **Actual Result:** [To be filled during testing]
- **Status:** Pass / Fail / Blocked

---

## TC-001: Login & Authentication
**Priority:** Critical  
**Role:** All

### Steps
1. Navigate to https://staging.yourdomain.com
2. Click "Login" or access login page
3. Enter valid credentials (admin@test.com / password)
4. Submit login form

### Expected Result
- Login successful
- Redirected to dashboard
- User role displayed correctly
- JWT token stored (check browser DevTools → Application → Storage)

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-002: RBAC - Page Access Control
**Priority:** Critical  
**Role:** Multiple roles

### Steps
1. Login as **Admin**
2. Verify all 11 pages visible in sidebar navigation
3. Logout
4. Login as **Agent** role
5. Verify only authorized pages visible (Call Audit 360, Agent Summary per PAGE_ACCESS)

### Expected Result
- Admin sees: All 11 pages
- T&Q Head sees: T&Q Master, Process Performance, Call Audit 360, Outbound Funnel, Agent Summary, Coaching, Governance, Inbound Quality
- QA Auditor sees: Call Audit 360, Inbound Quality
- Trainer sees: Coaching, Governance, LMS Sync
- TL sees: Call Audit 360, Outbound Funnel, Agent Summary, Coaching
- Agent sees: Call Audit 360
- Pages not in role's access are hidden

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-003: Process Selector
**Priority:** Critical  
**Role:** Admin

### Steps
1. Login as Admin
2. Navigate to T&Q Master page
3. Click process selector dropdown (top right)
4. Verify process list displays

### Expected Result
- Dropdown shows all processes from `ci_process_master`
- FINNABLE is in the list
- Processes grouped or sorted by type (optional)
- Selection changes active process

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-004: FINNABLE Outbound Funnel
**Priority:** Critical  
**Role:** T&Q Head, Ops Manager, Admin

### Steps
1. Login as T&Q Head
2. Select **FINNABLE** process from dropdown
3. Navigate to **Outbound Funnel** page
4. Verify funnel metrics load

### Expected Result
- Funnel metrics display:
  - Total Calls
  - Opening Done Count
  - Offered Count
  - Objection Handled Count
  - Sale Done Count
  - Conversion % (sales / total calls)
  - Offer Conversion % (sales / offered)
- Data comes from `db_external.CallDetails` (real data)
- Date filter functional (Today / Yesterday / Last 7D / Custom date)

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-005: Call List Display
**Priority:** High  
**Role:** T&Q Head, Admin

### Steps
1. Select FINNABLE process
2. Navigate to T&Q Master page
3. Scroll to "Recent Calls" table

### Expected Result
- Table displays recent calls with columns:
  - Call ID
  - Source Call ID
  - Agent Name
  - Lead ID
  - Call Date/Time
  - Transcript Status
  - Action button (Audit 360)
- Data loads from `ci_call_master`
- At least 1 call visible (if data exists)

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-006: Call Audit 360 Modal
**Priority:** Critical  
**Role:** T&Q Head, QA Auditor, Trainer, TL, Admin

### Steps
1. From call list, click "Audit 360" button on any call
2. Wait for modal to open

### Expected Result
- Modal opens with comprehensive audit details:
  - **Call Identity:** Call ID, Source Call ID, Process, Agent, Lead, Date, Duration
  - **AI Audit Status:** Risk Level, Processing Status, Quality %, Band, Disposition
  - **Outbound Sales Fields:** Opening, Offered, SaleDone, ProductOffering, DiscountType, CustomerObjectionCategory
  - **Transcript Preview:** First 500 characters of transcript
  - **Feedback Summary:** AI-generated feedback (if available)
- "Create Coaching" button visible
- "Close" button functional

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-007: Coaching Trigger Creation
**Priority:** Critical  
**Role:** T&Q Head, Trainer, TL, Admin

### Steps
1. Open Audit 360 modal (TC-006)
2. Click "Create Coaching" button
3. Wait for confirmation

### Expected Result
- POST request to `/api/coaching/trigger` successful
- Modal closes
- Success message displayed (alert or notification)
- New coaching trigger created in `ci_coaching_triggers` table
- Coaching page shows new trigger

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-008: Coaching Page Display
**Priority:** High  
**Role:** T&Q Head, Trainer, TL, Admin

### Steps
1. Select FINNABLE process
2. Navigate to **Coaching** page

### Expected Result
- Table displays coaching triggers with columns:
  - Trigger ID
  - Call ID
  - Employee Code
  - Coaching Topic
  - Priority (HIGH/MEDIUM/LOW) with color badges
  - Status (PENDING/ASSIGNED/COMPLETED) with color badges
  - Triggered At timestamp
  - Action buttons (Mark Complete if PENDING)
- Data loads from `ci_coaching_triggers` filtered by process_code

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-009: Coaching Status Update
**Priority:** High  
**Role:** T&Q Head, Trainer, TL, Admin

### Steps
1. From Coaching page, find a PENDING coaching trigger
2. Click "Mark Complete" button
3. Wait for update

### Expected Result
- PATCH request to `/api/coaching/:id/status` successful
- Status changes from PENDING to COMPLETED
- Badge color changes (yellow → green)
- Table refreshes automatically

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-010: Governance Actions Page
**Priority:** High  
**Role:** T&Q Head, Trainer, Admin

### Steps
1. Select FINNABLE process
2. Navigate to **Governance** page

### Expected Result
- KPI cards display:
  - Open Actions count
  - Closed Actions count
  - Overdue Actions count
  - Total Actions count
- Table displays governance actions with columns:
  - Action ID
  - Action Type
  - Owner Role
  - Employee Code
  - Priority badge
  - Due At timestamp
  - Status
  - Action button (Mark Closed if not CLOSED)
- Overdue rows highlighted in red background with ⚠ OVERDUE label

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-011: Governance Status Update
**Priority:** High  
**Role:** T&Q Head, Trainer, Admin

### Steps
1. From Governance page, find an OPEN governance action
2. Click "Mark Closed" button
3. Wait for update

### Expected Result
- PATCH request to `/api/governance/:id/status` successful
- Status changes to CLOSED
- Row updates, "Mark Closed" button disappears
- KPI cards refresh (open count decreases, closed count increases)

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-012: CSV Export - Calls
**Priority:** Medium  
**Role:** T&Q Head, Admin

### Steps
1. Navigate to Outbound Funnel page (FINNABLE selected)
2. Click "⬇ Export CSV" button on Recent Outbound Calls table
3. Wait for download

### Expected Result
- CSV file downloads: `calls-FINNABLE.csv`
- Opens in Excel/LibreOffice
- Contains columns matching table (Date, Agent, Lead, Opening, Offered, Sale, Product)
- Data matches table display
- No errors in file

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-013: CSV Export - Agents
**Priority:** Medium  
**Role:** T&Q Head, Ops Manager, Admin

### Steps
1. Navigate to Agent Summary page (FINNABLE selected)
2. Click "⬇ Export CSV" button
3. Wait for download

### Expected Result
- CSV file downloads: `agents-FINNABLE.csv`
- Contains: Agent Name, Total Calls, Active Days, Transcripts, AI Audit counts
- Data matches table display

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-014: Agent Drill-Down
**Priority:** Medium  
**Role:** T&Q Head, Ops Manager, TL, Admin

### Steps
1. Navigate to Agent Summary page (FINNABLE selected)
2. Click "View Calls" on any agent row
3. Wait for agent calls table to load below

### Expected Result
- New table appears with heading "Calls by [Agent Name]"
- Table displays agent's calls with columns: Call ID, Date, Duration, Transcript Status, Action (Audit 360)
- Filtered to selected agent and FINNABLE process

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-015: Inbound Quality Metrics
**Priority:** High  
**Role:** T&Q Head, QA Auditor, Admin

### Steps
1. Select an **inbound** process (not FINNABLE if it's outbound)
2. Navigate to **Inbound Quality** page

### Expected Result
- If inbound data exists, KPI cards display:
  - Audit Count
  - CQ Score (avg quality %)
  - Sensitive Word Count
  - Policy Failure Count
- Data from `db_audit.call_quality_assessment` (read-only)
- If no inbound data: "No inbound quality data available" message

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-016: Data Diagnostics Page
**Priority:** Medium  
**Role:** Admin only

### Steps
1. Login as Admin
2. Navigate to **Data Diagnostics** page

### Expected Result
- Table displays all processes with columns:
  - Process Code
  - Process Name
  - Type
  - Canonical Calls count
  - Raw Outbound Rows count
  - Raw Inbound Rows count
  - Status badge (READY/RAW_ONLY/CANONICAL_ONLY/NO_DATA)
- Status colors: READY=green, RAW_ONLY=yellow, CANONICAL_ONLY=blue, NO_DATA=red
- "Details" button on each row

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-017: Process Diagnostics Detail
**Priority:** Medium  
**Role:** Admin

### Steps
1. From Data Diagnostics page, click "Details" on FINNABLE row
2. Wait for detail panel to open

### Expected Result
- Detail panel displays:
  - Process Info: Process ID, Code, Type, Client ID
  - Data Counts: Canonical Calls, Raw Outbound/Inbound, Transcripts, Coaching, Governance
- Counts match actual database records
- "Close" button functional

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-018: Inbound Validation Test
**Priority:** Medium  
**Role:** Admin

### Steps
1. From Data Diagnostics page, scroll to "Inbound Validation Test" section

### Expected Result
- If inbound process exists:
  - Shows test process code
  - Raw inbound count
  - Canonical count
  - Status: MAPPED or UNMAPPED
  - Test endpoint URL
- If no inbound processes: "No inbound processes found" message

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-019: Deployment Checklist
**Priority:** High  
**Role:** Admin

### Steps
1. Navigate to **Deployment Checklist** page

### Expected Result
- Table displays system readiness items:
  - Environment variables configured: ✓
  - Database connection active: ✓
  - Auth mode set: ✓ or MOCK
  - Process summary table populated: ✓
  - Heavy views avoided: ✓
  - External DB read-only respected: ✓
  - Backend/Frontend ports: ✓ or INFO
- Pending items list displays:
  - Test FINNABLE end-to-end
  - Validate inbound quality endpoint
  - Review diagnostics for all processes
  - Production deployment

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-020: Date Filtering
**Priority:** High  
**Role:** T&Q Head, Admin

### Steps
1. Navigate to T&Q Master page
2. Click "Yesterday" quick filter button
3. Verify KPIs update
4. Select custom date from date picker
5. Verify data updates
6. Click "Today" to reset

### Expected Result
- Quick filters (Today, Yesterday, Last 7D) functional
- Custom date picker functional
- KPIs update based on selected date
- Process summary reflects filtered date
- "↻ Refresh" button reloads data

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-021: Process Performance Cross-Process View
**Priority:** High  
**Role:** T&Q Head, CEO, Ops Manager, Admin

### Steps
1. Navigate to **Process Performance** page

### Expected Result
- Table displays all processes (not filtered to selected process)
- Columns: Process Code, Name, Type, Total Calls, Agents, Transcripts, AI Audit
- "⬇ Export CSV" button functional
- Day-Wise Trend table shows date-wise aggregation

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-022: Top Objections Table
**Priority:** Medium  
**Role:** T&Q Head, Ops Manager, Admin

### Steps
1. Select FINNABLE process
2. Navigate to Outbound Funnel page
3. Locate "Top Objections" card

### Expected Result
- Table displays top 10 objection categories
- Columns: Category, Calls count, Conversion %
- Data from `db_external.CallDetails` CustomerObjectionCategory field
- "⬇ CSV" button exports objections

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-023: LMS Sync Placeholder
**Priority:** Low  
**Role:** Trainer, Admin

### Steps
1. Navigate to **LMS Sync** page

### Expected Result
- Placeholder page displays
- Blue info banner: "LMS integration placeholder..."
- Table shows coaching + governance status mapping
- No errors

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-024: Responsive UI - Mobile View
**Priority:** Low  
**Role:** Any

### Steps
1. Open browser DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Navigate through pages

### Expected Result
- Pages remain usable on mobile (though not optimized)
- No horizontal scroll
- Tables scrollable
- Buttons clickable

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-025: Browser Console - No Errors
**Priority:** High  
**Role:** Any

### Steps
1. Open browser DevTools (F12) → Console tab
2. Navigate through all pages
3. Perform actions (login, select process, open modals, etc.)

### Expected Result
- No console errors (red messages)
- No CORS errors
- No 404 errors
- Warnings acceptable (yellow messages)

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-026: Session Persistence
**Priority:** Medium  
**Role:** Any

### Steps
1. Login successfully
2. Navigate to several pages
3. Close browser tab
4. Reopen https://staging.yourdomain.com

### Expected Result
- User remains logged in (if JWT not expired)
- Session restored
- No need to re-login (within 24h token expiry)

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## TC-027: Logout
**Priority:** Medium  
**Role:** Any

### Steps
1. Login successfully
2. Click "Logout" button (if available)
3. OR: Clear browser storage and refresh

### Expected Result
- User logged out
- Redirected to login page
- JWT token cleared
- Cannot access protected pages

### Actual Result
[ ]

### Status
[ ] Pass  [ ] Fail  [ ] Blocked

---

## Test Summary

**Total Test Cases:** 27  
**Passed:** [ ]  
**Failed:** [ ]  
**Blocked:** [ ]  
**Pass Rate:** [ ]%

## Critical Issues Found
1. [ ]
2. [ ]
3. [ ]

## High Priority Issues
1. [ ]
2. [ ]

## Medium/Low Issues
1. [ ]
2. [ ]

## UAT Sign-Off

**Tested By:** ___________________  
**Date:** ___________________  
**Approved for Production:** [ ] Yes  [ ] No  [ ] Conditional

**Conditions (if any):**
- [ ]
- [ ]

**DevOps Sign-Off:** ___________________  
**Date:** ___________________
