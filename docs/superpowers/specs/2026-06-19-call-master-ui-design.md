# Call Master — Production UI System Design

**Date:** 2026-06-19
**Scope:** Frontend component architecture, hash routing, per-page data caching, new CEO/QA pages
**Approach:** Incremental extraction from `EnterpriseConsoleV2.tsx` — always shippable

---

## 1. Architecture Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| Extraction strategy | Incremental | Zero breakage risk; each PR is shippable |
| Routing | Hash routing (`react-router-dom` HashRouter) | Real URLs (`/#/executive`), no server config, works with Vite static build |
| Data loading | Per-page lazy fetch + 60s in-memory cache | Fast initial load, no redundant calls, matches backend auth cache TTL |
| Missing features | Real API + demo fallback | Same `readOrFallback` pattern already used backend-side |

---

## 2. File Structure

```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── Badge.tsx           # severity/status pill — variant prop maps to CSS class
│   │   ├── KpiCard.tsx         # metric tile — label, value, sub, loading skeleton
│   │   ├── DataTable.tsx       # sortable table — columns config, empty state, loading rows
│   │   ├── BarChart.tsx        # horizontal bar chart — items[], maxValue, loading skeleton
│   │   ├── Funnel.tsx          # funnel stage list — stages[], variant (sales|rejection)
│   │   ├── SectionTitle.tsx    # card h3 + subtitle — title, subtitle, action slot
│   │   ├── LoadingGrid.tsx     # skeleton grid — count, cols props
│   │   └── EmptyState.tsx      # icon + heading + body — icon, title, message, action slot
│   └── layout/
│       ├── AppShell.tsx        # sidebar + main grid wrapper
│       ├── Sidebar.tsx         # brand, nav buttons, process selector, team card
│       └── Topbar.tsx          # page title, date range filter, process filter, user badge
├── pages/
│   ├── ExecutivePage.tsx       # CEO view — KPIs, trends, risk heatmap, forecast
│   ├── SalesFunnelPage.tsx     # Sales funnel — filters, WoW change, agent drill-down
│   ├── RejectionFunnelPage.tsx # Rejection analysis — reason breakdown, recovery rate
│   ├── QualityPage.tsx         # QA Head — score distribution, parameter failures, fatal errors
│   ├── LiveAssistPage.tsx      # existing extracted
│   ├── AgentsPage.tsx          # existing extracted
│   ├── CoachingPage.tsx        # existing extracted
│   ├── GovernancePage.tsx      # existing extracted
│   ├── DiagnosticsPage.tsx     # existing extracted
│   ├── ExportPage.tsx          # existing extracted
│   ├── LibraryPage.tsx         # existing extracted
│   ├── AiStudioPage.tsx        # existing extracted
│   ├── ClientPortalPage.tsx    # existing extracted
│   └── SaasPage.tsx            # existing extracted
├── hooks/
│   └── usePageData.ts          # generic: fetch + 60s Map cache + loading/error state
├── services/
│   └── api.ts                  # already rewritten — apiGet, apiPost, apiPatch
└── main.tsx                    # mounts HashRouter → AppShell → <Routes>
```

---

## 3. Component Specs

### Badge
```typescript
interface BadgeProps {
  variant: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'disabled';
  children: React.ReactNode;
}
```
- Maps `variant` to existing CSS class names (`badge critical`, `badge high`, etc.)
- `role="status"` for screen readers

### KpiCard
```typescript
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'default' | 'gold' | 'danger';
  loading?: boolean;
  trend?: { value: number; direction: 'up' | 'down'; label: string };
}
```
- When `loading=true`: renders skeleton shimmer in place of value
- When `trend` provided: shows arrow + percentage + period label below `kpi-sub`
- `aria-label={label + ': ' + value}`

### DataTable
```typescript
interface Column<T> { key: keyof T; header: string; render?: (val: any, row: T) => React.ReactNode }
interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  rowKey: keyof T;
}
```
- `loading=true`: renders 5 skeleton rows
- `rows.length === 0`: renders `EmptyState` inline
- `th` elements get `scope="col"`, `role="columnheader"`

### Funnel
```typescript
interface FunnelStage {
  label: string;
  count: number;
  sub?: string;
  conversionRate?: number;
  dropRate?: number;
  change?: { value: number; direction: 'up' | 'down' };
  meta?: { label: string; value: string }[];
}
interface FunnelProps {
  stages: FunnelStage[];
  variant?: 'sales' | 'rejection';
  loading?: boolean;
}
```
- Width of each stage proportional to `count / stages[0].count`
- `change` prop shows WoW indicator badge when provided
- `loading=true`: 4 skeleton stages

### LoadingGrid
- Props: `count=6`, `cols=6`
- Renders `count` divs with shimmer animation using existing `kpi-card` class + CSS animation

### EmptyState
```typescript
interface EmptyStateProps {
  icon?: string;        // emoji or text icon
  title: string;
  message?: string;
  action?: React.ReactNode;  // e.g. a retry button
}
```

---

## 4. Data Hook

```typescript
// hooks/usePageData.ts
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL = 60_000;

function usePageData<T>(key: string, fetcher: () => Promise<T>) {
  // Returns: { data: T | null, loading: boolean, error: string | null, refresh: () => void }
  // - Checks cache on mount; if hit and not expired, sets data synchronously (no flash)
  // - On cache miss: sets loading=true, calls fetcher, caches result, sets data
  // - On error: sets error string, data stays null
  // - refresh(): clears cache entry and re-fetches
  // - Cancellation: useEffect cleanup sets cancelled flag, ignores stale responses
}
```

Each page calls this once per endpoint it needs. A page with multiple endpoints calls `usePageData` multiple times — one per endpoint. Since each hook instance runs its own `useEffect`, fetches fire in parallel automatically with no extra coordination needed.

---

## 5. Routing

```typescript
// main.tsx
<HashRouter>
  <AppShell>
    <Routes>
      <Route path="/" element={<ExecutivePage />} />
      <Route path="/executive" element={<ExecutivePage />} />
      <Route path="/sales-funnel" element={<SalesFunnelPage />} />
      <Route path="/rejection-funnel" element={<RejectionFunnelPage />} />
      <Route path="/quality" element={<QualityPage />} />
      <Route path="/live-assist" element={<LiveAssistPage />} />
      <Route path="/agents" element={<AgentsPage />} />
      <Route path="/coaching" element={<CoachingPage />} />
      <Route path="/governance" element={<GovernancePage />} />
      <Route path="/diagnostics" element={<DiagnosticsPage />} />
      <Route path="/export" element={<ExportPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/ai-studio" element={<AiStudioPage />} />
      <Route path="/client-portal" element={<ClientPortalPage />} />
      <Route path="/saas" element={<SaasPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AppShell>
</HashRouter>
```

`Sidebar` nav buttons use `<NavLink to="/executive">` — active state via `isActive` prop from React Router, replacing the current `activePage === 'executive'` pattern.

---

## 6. New Pages

### SalesFunnelPage
**API:** `GET /api/funnels/sales?processCode=X&from=YYYY-MM-DD&to=YYYY-MM-DD`
**New UI elements vs current:**
- Date range picker (from/to inputs in Topbar filter slot)
- WoW change indicator on each funnel stage (requires backend to return `prev_count`)
- Agent drill-down table below funnel: columns = Agent, Calls, Conversions, Rate, QA Score
- Goal line indicator on top stage: "Target: 500 calls/day"
- Rebuttal effectiveness sub-section: table of rejection reason → rebuttal used → recovery %

**Demo fallback:** Hardcoded realistic data matching current funnel shape

### RejectionFunnelPage
**API:** `GET /api/funnels/rejection?processCode=X&from=YYYY-MM-DD&to=YYYY-MM-DD`
**New UI elements:**
- Rejection reason breakdown BarChart: Price / Timing / Not Interested / Compliance / Other
- Recovery rate KpiCard: "Of rejected calls, X% converted on callback"
- Competitor mentions BarChart: Brand A / Brand B / Brand C
- Trend line: 7-day rejection rate (rendered as CSS-based sparkline — no chart library)

**Demo fallback:** Realistic rejection distribution data

### QualityPage (QA Head view — entirely new)
**APIs:** `GET /api/quality/scores`, `GET /api/quality/parameters`, `GET /api/quality/fatal`
**Sections:**
1. **Score distribution** — KpiCards for each band (60-70, 70-80, 80-90, 90-100) + count
2. **Parameter failure rates** — DataTable: Parameter | Category | Fail Rate | Fatal? | Trend
3. **Fatal error drill-down** — DataTable: Call ID | Agent | Date | Parameter | Auditor
4. **Auditor consistency** — DataTable: Auditor | Calls Audited | Avg Score | Variance vs Peers
5. **Coach → improvement tracker** — DataTable: Agent | Coaching Date | Score Before | Score After | Delta

**Demo fallback:** Representative QA data for all 5 sections

### ExecutivePage additions (CEO view)
**New elements vs current:**
- MoM/WoW trend arrows on all 6 KPI cards (requires `prev_value` from API)
- Process comparison table: side-by-side KPIs per process
- Risk heatmap: 2×N grid, process vs risk dimension (conversion, quality, compliance, attrition)
- Revenue forecast card: current conversion rate × avg ticket → projected monthly revenue

---

## 7. Accessibility Standards

Every component must have:
- Semantic HTML (`<table>`, `<th scope="col">`, `<button>`, `<nav>`, `<main>`, `<header>`)
- `aria-label` on icon-only buttons
- `aria-busy="true"` on loading containers
- `aria-live="polite"` on data regions that update
- Focus ring visible (`:focus-visible` outline, already partially in existing CSS)
- Color not the only indicator of status (badge always has text label)
- Keyboard navigation: all interactive elements reachable via Tab

---

## 8. Responsive Breakpoints

Existing breakpoints in `styles.css` are kept:
- `≤1280px`: KPI grid 3 cols, stacked two-col layouts
- `≤860px`: single column, sidebar unsticky, all grids 1 col

New pages follow the same grid patterns — no new breakpoints needed.

---

## 9. Implementation Order

Extract in this order to minimize risk — each step leaves the app in a working state:

1. `Badge`, `KpiCard`, `SectionTitle`, `EmptyState`, `LoadingGrid` — pure display, zero risk
2. `DataTable`, `BarChart`, `Funnel` — extract with existing data shapes
3. `usePageData` hook — replaces the monolithic `Promise.all` one page at a time
4. `AppShell`, `Sidebar`, `Topbar` — layout extraction + add React Router
5. Extract existing pages one by one (LiveAssist → Agents → Coaching → etc.)
6. Build `SalesFunnelPage`, `RejectionFunnelPage`, `QualityPage` with new sections
7. Enhance `ExecutivePage` with trend/forecast/heatmap sections

---

## 10. What Is NOT in Scope

- Login page (auth flow unchanged)
- Backend API changes (all new UI uses existing endpoints + demo fallback)
- State management library (React state + hooks is sufficient)
- Chart library (all visuals use CSS — no Recharts, Chart.js, etc.)
- Testing (unit tests deferred — covered by TypeScript strict mode + manual QA)
- Dark/light mode toggle (existing dark theme only)
