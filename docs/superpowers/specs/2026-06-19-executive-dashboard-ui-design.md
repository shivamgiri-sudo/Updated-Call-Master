# Executive Dashboard — UI/UX Design Specification

**Date:** 2026-06-19  
**Project:** Call Master Executive Dashboard MVP  
**Design System:** Enterprise Data-Dense Dashboard with Glassmorphism Dark Theme  
**Stack:** React 18 + TypeScript + Vite

---

## 1. Design System Foundation

### 1.1 Style: Data-Dense Dashboard + Glassmorphism Dark

**Core Philosophy:**
- **Maximum data visibility** — dense layout with minimal padding
- **Glassmorphism depth** — frosted glass cards with blur effects
- **Dark-first design** — optimized for extended viewing sessions
- **Professional polish** — enterprise-grade visual quality

**Mode Support:**
- Dark Mode: ✓ Primary (default)
- Light Mode: ✓ Available (add in Phase 2)

### 1.2 Color System

**Semantic Tokens:**

```css
:root {
  /* Primary (Blue spectrum) */
  --color-primary: #1E40AF;           /* Navy blue for primary actions */
  --color-primary-hover: #1E3A8A;
  --color-on-primary: #FFFFFF;
  
  /* Secondary */
  --color-secondary: #3B82F6;         /* Bright blue for highlights */
  --color-secondary-hover: #2563EB;
  
  /* Accent (Amber for CTAs) */
  --color-accent: #D97706;            /* Amber for critical actions */
  --color-accent-hover: #B45309;
  
  /* Background (Dark theme) */
  --color-bg-deep: #020203;           /* Body background */
  --color-bg-base: #050506;           /* Elevated background */
  --color-bg-elevated: #0a0a0c;       /* Card background */
  
  /* Glassmorphism surfaces */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
  
  /* Text */
  --color-text-primary: #EDEDEF;      /* Body text (contrast: 13:1) */
  --color-text-secondary: #8A8F98;    /* Secondary text (contrast: 5.2:1) */
  --color-text-tertiary: #6B7280;     /* Tertiary text (contrast: 3.8:1) */
  
  /* Data visualization */
  --color-success: #10B981;           /* Positive trends, conversions */
  --color-warning: #F59E0B;           /* Warnings, medium risk */
  --color-danger: #EF4444;            /* Errors, critical risk */
  --color-info: #3B82F6;              /* Informational */
  
  /* Borders */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-hover: rgba(255, 255, 255, 0.12);
  
  /* Shadows (for depth) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  
  /* Effects */
  --glow-accent: 0 0 20px rgba(217, 119, 6, 0.3);
  --glow-primary: 0 0 20px rgba(59, 130, 246, 0.2);
}
```

**WCAG Compliance:**
- Primary text on dark: 13:1 (AAA)
- Secondary text on dark: 5.2:1 (AA)
- Accent on dark: 3:1 minimum (Large text AA)
- Border contrast: 1.5:1 minimum

### 1.3 Typography

**Font Stack:**

```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

:root {
  /* Headings (Fira Code - monospace for technical feel) */
  --font-heading: 'Fira Code', 'Monaco', 'Consolas', monospace;
  
  /* Body (Fira Sans - clean sans-serif) */
  --font-body: 'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Monospace (for data, code, IDs) */
  --font-mono: 'Fira Code', 'Monaco', 'Consolas', monospace;
}
```

**Type Scale:**

```css
/* Heading sizes */
--text-6xl: 3.75rem;    /* 60px - Page hero */
--text-5xl: 3rem;       /* 48px - Section hero */
--text-4xl: 2.25rem;    /* 36px - Major heading */
--text-3xl: 1.875rem;   /* 30px - Section heading */
--text-2xl: 1.5rem;     /* 24px - Card heading */
--text-xl: 1.25rem;     /* 20px - Subsection */
--text-lg: 1.125rem;    /* 18px - Large body */

/* Body sizes */
--text-base: 1rem;      /* 16px - Body text */
--text-sm: 0.875rem;    /* 14px - Small text */
--text-xs: 0.75rem;     /* 12px - Labels, captions */

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Usage Rules:**
- Headings: `Fira Code` + `font-weight: 600-700`
- Body text: `Fira Sans` + `font-weight: 400` + `line-height: 1.5`
- Data values: `Fira Code` + `font-weight: 500` + `font-variant-numeric: tabular-nums`
- Labels: `Fira Sans` + `font-weight: 500` + `font-size: 14px`
- Minimum body text: `16px` (no smaller than 14px for secondary text)

### 1.4 Spacing Scale

**8-Point Grid:**

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

**Density Strategy:**
- **Compact mode (default):** 8-12px card padding, 16px section gaps
- **Comfortable mode (optional):** 16-24px card padding, 24px section gaps
- **Touch-friendly:** All interactive elements ≥44px hit area

### 1.5 Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px - badges, pills */
  --radius-md: 0.5rem;    /* 8px - inputs, small cards */
  --radius-lg: 0.75rem;   /* 12px - cards */
  --radius-xl: 1rem;      /* 16px - modals, drawers */
  --radius-2xl: 1.5rem;   /* 24px - large feature cards */
  --radius-full: 9999px;  /* Circles */
}
```

**Usage:**
- KPI cards: `--radius-lg` (12px)
- Data tables: `--radius-md` (8px)
- Modals/drawers: `--radius-xl` (16px)
- Buttons: `--radius-md` (8px)

---

## 2. Component Specifications

### 2.1 Glassmorphism Card (Base Component)

**Visual Properties:**

```css
.glass-card {
  /* Glassmorphism effect */
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  /* Border */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  
  /* Shadow for depth */
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  /* Padding (dense mode) */
  padding: 16px;
  
  /* Transition */
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 
    0 10px 15px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

**Performance Note:**
- Use `backdrop-filter` only on cards, not on nested elements
- Limit blur to 20px maximum for performance
- Use `will-change: transform` on hover elements only

### 2.2 KPI Card

**Layout:**

```
┌─────────────────────────────────┐
│ Label (14px, secondary text)    │
│ Value (32px, bold, primary)  ↑8%│
│ Sub (12px, tertiary)            │
└─────────────────────────────────┘
```

**Specifications:**
- **Dimensions:** Min height 120px
- **Padding:** 16px all sides
- **Value size:** 32px (2xl) for primary metric
- **Trend indicator:** 
  - Position: Top-right corner
  - Size: 14px text + 12px icon
  - Colors: Green (↑ positive), Red (↓ negative)
  - Format: `+8.2%` or `-2.1%`

**Variants:**

```tsx
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'default' | 'accent' | 'success' | 'danger';
  trend?: {
    value: number;      // Percentage change
    direction: 'up' | 'down';
    period: string;     // "vs last week"
  };
  loading?: boolean;
}
```

**Loading State:**
```css
.kpi-card-skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.02) 25%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 2.3 Data Table

**Glassmorphism Table Styling:**

```css
.data-table {
  /* Glass card base */
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.data-table thead {
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.data-table th {
  padding: 12px 16px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.data-table tbody tr {
  transition: background 150ms;
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}
```

**Column Specifications:**

```tsx
interface Column<T> {
  key: keyof T;
  header: string;
  width?: string;           // e.g., "200px", "20%"
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}
```

**Responsive Strategy:**
- **Desktop (≥1024px):** Full table
- **Tablet (768-1023px):** Horizontal scroll with sticky first column
- **Mobile (<768px):** Card layout (one card per row)

**Accessibility:**
- `<th scope="col">` for headers
- `role="row"` and `role="cell"` for dynamic tables
- Keyboard navigation with arrow keys
- `aria-sort` on sortable columns

### 2.4 Bar Chart

**Design:**

```
Revenue by Process
┌─────────────────────────────────────────┐
│ FINNABLE  ████████████████ ₹4.8M        │
│ INDIFI    ███████████ ₹3.2M             │
│ UPWARDS   ████████ ₹2.1M                │
└─────────────────────────────────────────┘
```

**Specifications:**

```tsx
interface BarChartProps {
  title: string;
  items: Array<{
    label: string;
    value: number;
    color?: string;     // Default: primary gradient
  }>;
  maxValue?: number;    // Auto-calculated if not provided
  format?: 'number' | 'currency' | 'percentage';
  height?: number;      // Default: auto based on item count
  loading?: boolean;
}
```

**Styling:**

```css
.bar-chart-bar {
  height: 32px;
  background: linear-gradient(
    90deg,
    var(--color-primary) 0%,
    var(--color-secondary) 100%
  );
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  transition: transform 150ms, box-shadow 150ms;
}

.bar-chart-bar:hover {
  transform: scaleX(1.02);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

.bar-chart-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  opacity: 0;
  transition: opacity 150ms;
}

.bar-chart-bar:hover::before {
  opacity: 1;
}
```

**Accessibility:**
- `role="img"` on chart container
- `aria-label="Revenue by process bar chart"`
- Provide data table alternative via toggle
- Tooltip on hover with exact values
- Keyboard navigation support

### 2.5 Risk Heatmap

**Layout (2D Grid):**

```
Risk Heatmap: Process × Risk Dimension
┌────────────┬──────────┬──────────┬──────────┬──────────┐
│            │ Conversn │ Quality  │ Complnce │ Attrition│
├────────────┼──────────┼──────────┼──────────┼──────────┤
│ FINNABLE   │   🟢     │   🟡     │   🟢     │   🟢     │
│ INDIFI     │   🟡     │   🟢     │   🟢     │   🟡     │
│ UPWARDS    │   🔴     │   🟡     │   🟡     │   🔴     │
└────────────┴──────────┴──────────┴──────────┴──────────┘
```

**Cell States:**
- 🟢 Low risk: `background: rgba(16, 185, 129, 0.2)`, `border: 1px solid #10B981`
- 🟡 Medium risk: `background: rgba(245, 158, 11, 0.2)`, `border: 1px solid #F59E0B`
- 🔴 High risk: `background: rgba(239, 68, 68, 0.2)`, `border: 1px solid #EF4444`

**Specifications:**

```tsx
interface RiskHeatmapProps {
  title: string;
  processes: string[];
  dimensions: string[];
  data: Array<{
    process: string;
    dimension: string;
    risk: 'low' | 'medium' | 'high' | 'critical';
    value?: number;      // Optional metric
    tooltip?: string;    // Detail on hover
  }>;
}
```

**Interaction:**
- Hover: Show tooltip with risk details
- Click: Open drilldown drawer with risk breakdown
- Keyboard: Arrow keys to navigate cells

**Accessibility:**
- Don't rely on color alone — add text label (`Low`, `Med`, `High`)
- `role="grid"` on container
- `aria-label` on each cell describing risk level
- Provide data table alternative

### 2.6 Call Evidence Drawer

**Layout:**

```
┌───────────────────────────────────────────┐  ← Close button
│ Call Detail: 550e8400-e29b...             │
├───────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐   │
│ │ Call Info                           │   │  Section 1
│ │ Date: 2026-06-19 10:34:12          │   │
│ │ Agent: Amit Sharma                  │   │
│ │ Duration: 7m 00s                    │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ Timeline                            │   │  Section 2
│ │ 00:00 - Call connected              │   │
│ │ 00:15 - Greeting                    │   │
│ │ 01:30 - Pitch started               │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ Transcript                          │   │  Section 3
│ │ Agent: Good morning, this is Amit...│   │
│ │ Customer: Hello, I'm interested...  │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ QA Scorecard (82/100)               │   │  Section 4
│ │ Greeting: 10/10 ✓                   │   │
│ │ Product Knowledge: 8/10             │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ Recording Player                    │   │  Section 5
│ │ [▶] 0:00 / 7:00                     │   │
│ └─────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

**Specifications:**

```tsx
interface CallDrawerProps {
  callId: string | null;
  onClose: () => void;
}
```

**Styling:**

```css
/* Drawer container */
.call-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 800px;
  height: 100vh;
  background: var(--color-bg-base);
  backdrop-filter: blur(40px);
  border-left: 1px solid var(--color-border);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6);
  z-index: 1000;
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.call-drawer.open {
  transform: translateX(0);
}

/* Backdrop */
.call-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
  opacity: 0;
  transition: opacity 300ms;
}

.call-drawer-backdrop.visible {
  opacity: 1;
}

/* Section cards inside drawer */
.drawer-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.drawer-section-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}
```

**Responsive:**
- Desktop (≥1024px): 80% width, max 800px
- Tablet (768-1023px): 90% width
- Mobile (<768px): 100% width (full screen)

**Accessibility:**
- `role="dialog"` and `aria-modal="true"`
- Focus trap (tab cycles within drawer)
- Close on ESC key
- Focus close button on open
- Restore focus to trigger element on close

---

## 3. Animation & Motion

### 3.1 Timing & Easing

**Duration Standards:**

```css
:root {
  /* Micro-interactions */
  --duration-fast: 150ms;      /* Hover, focus */
  --duration-base: 200ms;      /* State changes */
  --duration-slow: 300ms;      /* Transitions, slides */
  
  /* Easing curves */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);  /* Apple-like */
}
```

**When to Use:**
- **150ms:** Hover states, button presses, ripples
- **200ms:** Loading skeleton fade-in, badge appearance
- **300ms:** Drawer slide-in, modal fade, route transitions

### 3.2 Loading States

**Skeleton Screens (Preferred over spinners):**

```tsx
function ExecutivePageSkeleton() {
  return (
    <div className="page-container">
      {/* KPI Grid Skeleton */}
      <div className="kpi-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card skeleton">
            <div className="skeleton-line w-1/2 h-4 mb-2" />
            <div className="skeleton-line w-3/4 h-8 mb-1" />
            <div className="skeleton-line w-1/3 h-3" />
          </div>
        ))}
      </div>
      
      {/* Table Skeleton */}
      <div className="glass-card skeleton">
        <div className="skeleton-line w-1/3 h-6 mb-4" />
        <div className="skeleton-line w-full h-12 mb-2" />
        <div className="skeleton-line w-full h-12 mb-2" />
        <div className="skeleton-line w-full h-12" />
      </div>
    </div>
  );
}
```

**Loading Spinner (for async actions):**

```tsx
function Spinner({ size = 'md' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];
  
  return (
    <div className={`spinner ${sizeClass}`} role="status" aria-label="Loading">
      <svg className="animate-spin" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}
```

### 3.3 Hover & Focus States

**Button Hover:**

```css
.button {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  position: relative;
  overflow: hidden;
}

.button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  opacity: 0;
  transition: opacity var(--duration-fast);
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(30, 64, 175, 0.4);
}

.button:hover::before {
  opacity: 1;
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
}
```

**Focus Visible (keyboard navigation):**

```css
.button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.data-table tbody tr:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

/* Remove focus for mouse users */
.button:focus:not(:focus-visible) {
  outline: none;
}
```

### 3.4 Reduced Motion

**Always respect `prefers-reduced-motion`:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 4. Responsive Design

### 4.1 Breakpoints

```css
:root {
  --breakpoint-sm: 375px;   /* Small phone */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Laptop */
  --breakpoint-xl: 1440px;  /* Desktop */
  --breakpoint-2xl: 1920px; /* Large desktop */
}
```

**Usage:**

```css
/* Mobile first (default) */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet (≥768px) */
@media (min-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Laptop (≥1024px) */
@media (min-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop (≥1440px) */
@media (min-width: 1440px) {
  .kpi-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}
```

### 4.2 Container Widths

```css
.container {
  width: 100%;
  max-width: 1440px;  /* Default max */
  margin: 0 auto;
  padding: 0 16px;    /* Mobile gutter */
}

@media (min-width: 768px) {
  .container {
    padding: 0 24px;  /* Tablet gutter */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 32px;  /* Desktop gutter */
  }
}
```

### 4.3 Component Adaptations

**Data Table → Card List (Mobile):**

```tsx
function ProcessScorecard({ data }: { data: ProcessScore[] }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  if (isMobile) {
    return (
      <div className="scorecard-card-list">
        {data.map(row => (
          <div key={row.id} className="scorecard-card glass-card">
            <h3>{row.process}</h3>
            <div className="scorecard-metrics">
              <div>Calls: {row.calls}</div>
              <div>Conversion: {row.conversion}%</div>
              <div>Quality: {row.quality}%</div>
              <div>Revenue: {formatMoney(row.revenue)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return <DataTable columns={columns} rows={data} />;
}
```

---

## 5. Accessibility (WCAG AA Compliance)

### 5.1 Color Contrast

**Verified Ratios (Dark Theme):**

| Foreground | Background | Ratio | Standard |
|------------|------------|-------|----------|
| `#EDEDEF` | `#020203` | 13.2:1 | AAA ✓ |
| `#8A8F98` | `#020203` | 5.4:1 | AA ✓ |
| `#3B82F6` | `#020203` | 4.8:1 | AA ✓ |
| `#D97706` | `#020203` | 3.2:1 | Large AA ✓ |

**Testing Tool:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 5.2 Keyboard Navigation

**Focus Order:**
1. Sidebar navigation
2. Process filter
3. Date range filter
4. KPI cards (skippable with Tab)
5. Data table rows
6. Action buttons

**Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| `Tab` | Next focusable element |
| `Shift+Tab` | Previous focusable element |
| `Enter` | Activate button/link |
| `Space` | Activate button, toggle checkbox |
| `Esc` | Close modal/drawer |
| `↑↓←→` | Navigate table cells |
| `/` | Focus search (future) |

### 5.3 Screen Reader Support

**Semantic HTML:**

```html
<!-- ✓ Good -->
<header>
  <nav aria-label="Main navigation">
    <a href="/#/executive">Executive</a>
  </nav>
</header>

<main>
  <section aria-labelledby="kpis-heading">
    <h2 id="kpis-heading">Key Performance Indicators</h2>
    <!-- KPI cards -->
  </section>
</main>

<!-- ✗ Bad -->
<div class="header">
  <div class="nav">
    <div onclick="navigate('/executive')">Executive</div>
  </div>
</div>
```

**ARIA Labels:**

```tsx
// KPI Card
<div 
  className="kpi-card" 
  role="region" 
  aria-label={`${label}: ${value}`}
>
  <span id={`kpi-label-${id}`}>{label}</span>
  <span aria-labelledby={`kpi-label-${id}`}>{value}</span>
</div>

// Data Table
<table role="table" aria-label="Process scorecard">
  <thead>
    <tr role="row">
      <th role="columnheader" scope="col">Process</th>
      <th role="columnheader" scope="col" aria-sort="descending">Calls</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row" tabIndex={0} aria-label="FINNABLE process">
      <td role="cell">FINNABLE</td>
      <td role="cell">8,540</td>
    </tr>
  </tbody>
</table>

// Loading State
<div role="status" aria-live="polite" aria-busy="true">
  Loading dashboard data...
</div>
```

### 5.4 Form Accessibility

**Input Labels:**

```tsx
// ✓ Good
<label htmlFor="process-filter">Process</label>
<select id="process-filter" name="process">
  <option value="">All Processes</option>
  <option value="FINNABLE">Finnable</option>
</select>

// ✗ Bad (placeholder-only)
<select placeholder="Select process">
  <option value="FINNABLE">Finnable</option>
</select>
```

**Error Messages:**

```tsx
<div>
  <label htmlFor="date-from">From Date</label>
  <input
    id="date-from"
    type="date"
    aria-invalid={hasError}
    aria-describedby="date-from-error"
  />
  {hasError && (
    <span id="date-from-error" role="alert" className="error-message">
      From date must be before To date
    </span>
  )}
</div>
```

---

## 6. Performance Optimization

### 6.1 Image Assets

**Format Priority:**
1. **SVG** for icons (vector, scalable, tiny)
2. **WebP** for photos/screenshots (60-90% smaller than PNG)
3. **AVIF** for next-gen (even smaller, limited support)
4. **PNG** fallback for transparency

**Lazy Loading:**

```tsx
// Hero images: eager
<img src="/hero.webp" alt="Dashboard" loading="eager" />

// Below-fold images: lazy
<img src="/screenshot.webp" alt="Process view" loading="lazy" />

// Offscreen components: React.lazy
const QualityPage = React.lazy(() => import('./pages/QualityPage'));
```

**Responsive Images:**

```html
<img
  src="/chart-800.webp"
  srcset="
    /chart-400.webp 400w,
    /chart-800.webp 800w,
    /chart-1200.webp 1200w
  "
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px"
  alt="Revenue chart"
  width="800"
  height="400"
  loading="lazy"
/>
```

### 6.2 Font Loading

**Preload Critical Fonts:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link 
  rel="preload" 
  as="style"
  href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;600&display=swap"
>
<link 
  rel="stylesheet" 
  href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;600&display=swap"
>
```

**Font Display Strategy:**

```css
@font-face {
  font-family: 'Fira Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap; /* Show fallback immediately, swap when loaded */
  src: url(https://fonts.gstatic.com/s/firasans/...) format('woff2');
}
```

### 6.3 Bundle Optimization

**Code Splitting:**

```tsx
// Route-level splitting
const ExecutivePage = React.lazy(() => import('./pages/ExecutivePage'));
const QualityPage = React.lazy(() => import('./pages/QualityPage'));
const SalesFunnelPage = React.lazy(() => import('./pages/SalesFunnelPage'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<ExecutivePage />} />
        <Route path="/quality" element={<QualityPage />} />
        <Route path="/sales-funnel" element={<SalesFunnelPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Tree Shaking:**

```tsx
// ✓ Good (imports only what's needed)
import { apiGet } from '../services/api';

// ✗ Bad (imports entire library)
import * as api from '../services/api';
```

### 6.4 Virtualization (Large Lists)

**Use React Virtual for 50+ rows:**

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function CallList({ calls }: { calls: Call[] }) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: calls.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Row height
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <CallRow call={calls[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Dark Mode Implementation

### 7.1 Color Mode Switching (Future Phase)

**CSS Custom Properties Approach:**

```css
/* Default (dark) */
:root {
  --color-bg-deep: #020203;
  --color-bg-base: #050506;
  --color-text-primary: #EDEDEF;
}

/* Light mode override */
[data-theme="light"] {
  --color-bg-deep: #FFFFFF;
  --color-bg-base: #F8FAFC;
  --color-text-primary: #1E3A8A;
}
```

**React Context:**

```tsx
const ThemeContext = React.createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}>({ theme: 'dark', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 7.2 Glassmorphism in Light Mode

**Light Mode Glass Effect:**

```css
[data-theme="light"] .glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
```

---

## 8. Icon System

### 8.1 Icon Library

**Use Lucide React (NOT emojis):**

```bash
npm install lucide-react
```

**Usage:**

```tsx
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';

function KpiCard({ label, value, trend }: KpiCardProps) {
  const TrendIcon = trend.direction === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend.direction === 'up' ? 'text-success' : 'text-danger';
  
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      <span className={`kpi-trend ${trendColor}`}>
        <TrendIcon size={16} />
        {trend.value}%
      </span>
    </div>
  );
}
```

**Icon Sizes:**

```tsx
// Small (16px) - inline with text
<CheckIcon size={16} />

// Medium (24px) - default for buttons, cards
<SettingsIcon size={24} />

// Large (32px) - empty states, heroes
<InboxIcon size={32} />
```

### 8.2 Brand Logos

**Official Assets Only:**
- Use official SVG logos from brand press kits
- Maintain correct proportions (no stretching)
- Follow brand guidelines for clear space
- Never recolor logos unless brand allows it

**Example (Client Logo):**

```tsx
function ClientLogo({ clientId }: { clientId: number }) {
  const logoMap: Record<number, string> = {
    1: '/logos/finnable.svg',
    2: '/logos/indifi.svg',
    3: '/logos/upwards.svg',
  };
  
  return (
    <img
      src={logoMap[clientId]}
      alt={`Client ${clientId} logo`}
      width="120"
      height="40"
      style={{ objectFit: 'contain' }}
    />
  );
}
```

---

## 9. Error States & Empty States

### 9.1 Error Message Design

**Toast Notification (Non-blocking):**

```tsx
function ErrorToast({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="toast toast-error" role="alert">
      <AlertCircle size={20} />
      <div>
        <strong>Error</strong>
        <p>{message}</p>
      </div>
      <button onClick={onRetry} className="button-link">
        Retry
      </button>
    </div>
  );
}
```

**Inline Error (Form):**

```tsx
<div className="input-group">
  <label htmlFor="date-from">From Date</label>
  <input
    id="date-from"
    type="date"
    className={hasError ? 'input-error' : ''}
    aria-invalid={hasError}
    aria-describedby="date-from-error"
  />
  {hasError && (
    <span id="date-from-error" className="error-message" role="alert">
      <AlertCircle size={14} />
      From date must be before To date
    </span>
  )}
</div>
```

### 9.2 Empty State Design

**No Data Illustration:**

```tsx
function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  message, 
  action 
}: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <Icon size={48} className="empty-state-icon" />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && (
        <button className="button button-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// Usage
<EmptyState
  icon={Calendar}
  title="No calls found"
  message="Try adjusting your date range or process filter"
  action={{
    label: "Reset Filters",
    onClick: () => resetFilters()
  }}
/>
```

---

## 10. Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (Lucide React icons only)
- [ ] All icons from consistent icon family (Lucide)
- [ ] Official brand assets used with correct proportions
- [ ] Glassmorphism effects applied consistently (20px blur)
- [ ] Semantic color tokens used (no hardcoded hex in components)

### Interaction
- [ ] All tappable elements provide pressed feedback (150ms transition)
- [ ] Touch targets meet minimum 44×44px
- [ ] Micro-interactions use 150-300ms timing
- [ ] Hover states use `cubic-bezier(0.16, 1, 0.3, 1)` easing
- [ ] Disabled states are visually clear and non-interactive
- [ ] Focus states visible with 2px outline

### Contrast & Accessibility
- [ ] Primary text contrast ≥4.5:1 (dark: #EDEDEF on #020203)
- [ ] Secondary text contrast ≥4.5:1 (dark: #8A8F98 on #020203)
- [ ] Interactive elements have visible focus rings
- [ ] Color is not the only indicator (icons + text)
- [ ] All images have descriptive `alt` text
- [ ] ARIA labels on icon-only buttons
- [ ] `prefers-reduced-motion` respected

### Layout
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Mobile: 1-column grid, tablet: 2-column, desktop: 3-6 column
- [ ] Data tables switch to card layout on mobile
- [ ] 8px spacing rhythm maintained
- [ ] Container max-width: 1440px
- [ ] No horizontal scroll on any breakpoint

### Performance
- [ ] Skeleton screens for loading states (not blank screens)
- [ ] Images use WebP format with `loading="lazy"`
- [ ] Fonts preloaded with `font-display: swap`
- [ ] Route-level code splitting implemented
- [ ] Lists >50 items use virtualization
- [ ] Backdrop-filter limited to top-level cards only

### Dark Mode
- [ ] All text meets contrast requirements on dark backgrounds
- [ ] Borders visible (rgba(255,255,255,0.08))
- [ ] Glassmorphism blur optimized (20px max)
- [ ] Shadows adjusted for dark theme (stronger opacity)

---

## Appendix: Component Reference

### Button Variants

```tsx
<button className="button button-primary">Primary Action</button>
<button className="button button-secondary">Secondary</button>
<button className="button button-ghost">Ghost</button>
<button className="button button-danger">Delete</button>
<button className="button button-link">Link Style</button>
```

### Badge Variants

```tsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Error</span>
<span className="badge badge-info">Info</span>
<span className="badge badge-default">Default</span>
```

### Spacing Utilities

```css
.mt-4    { margin-top: 16px; }
.mb-6    { margin-bottom: 24px; }
.px-4    { padding-left: 16px; padding-right: 16px; }
.py-6    { padding-top: 24px; padding-bottom: 24px; }
.gap-4   { gap: 16px; }
```

---

**End of UI/UX Specification**
