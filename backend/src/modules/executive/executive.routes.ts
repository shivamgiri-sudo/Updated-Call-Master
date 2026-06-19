import { Router } from "express";

const router = Router();

const processScorecards = [
  { process: "FINNABLE", branch: "Noida", calls: 12840, conversion: 18.57, rejection: 38.8, quality: 84.7, revenue: 4432000, risk: "HIGH" },
  { process: "INSURANCE-UPSELL", branch: "Ahmedabad", calls: 8420, conversion: 21.3, rejection: 32.1, quality: 88.2, revenue: 6120000, risk: "MEDIUM" },
  { process: "RETENTION", branch: "Noida", calls: 6988, conversion: 16.1, rejection: 41.6, quality: 81.4, revenue: 3924000, risk: "CRITICAL" },
  { process: "SUPPORT-INBOUND", branch: "Ahmedabad", calls: 10188, conversion: 0, rejection: 0, quality: 91.6, revenue: 0, risk: "LOW" }
];

const insightCards = [
  {
    id: "INS-001",
    severity: "CRITICAL",
    title: "Sales leakage after need discovery",
    process: "FINNABLE",
    impact: "₹31.9L estimated missed revenue",
    evidence: "1,596 calls dropped between Need Identified and Offer Explained. 92% of leakage is coachable.",
    recommendation: "Run immediate micro-coaching on need-to-offer bridge and add live prompt when agent pitches without customer need linkage.",
    owner: "Training + TL",
    due: "Today"
  },
  {
    id: "INS-002",
    severity: "HIGH",
    title: "Price objection spike",
    process: "FINNABLE",
    impact: "+24.5% vs 7-day baseline",
    evidence: "Price objection appears before value explanation in 37% sampled rejected calls.",
    recommendation: "Enforce value-before-price script. Add live warning when price is mentioned before benefit statement.",
    owner: "QA + Ops",
    due: "24 hours"
  },
  {
    id: "INS-003",
    severity: "CRITICAL",
    title: "Weak rebuttal recovery",
    process: "RETENTION",
    impact: "2,410 failed rebuttal moments",
    evidence: "Agents acknowledge objection but do not ask a follow-up question before rebuttal.",
    recommendation: "Deploy two-step rebuttal framework: acknowledge → probe → benefit map → close.",
    owner: "Trainer",
    due: "48 hours"
  },
  {
    id: "INS-004",
    severity: "MEDIUM",
    title: "Best performer pattern detected",
    process: "INSURANCE-UPSELL",
    impact: "+6.7 pp conversion uplift",
    evidence: "Top agents explain urgency within 90 seconds and personalize benefit using customer context.",
    recommendation: "Move top 10 calls to Best Call Library and use snippets in huddles.",
    owner: "Quality Lead",
    due: "This week"
  },
  {
    id: "INS-005",
    severity: "HIGH",
    title: "Quality is high but sales is low",
    process: "FINNABLE",
    impact: "Quality 84.7% but conversion 18.57%",
    evidence: "Agents are polite and compliant but not persuasive during offer and urgency stages.",
    recommendation: "Split audit score into compliance quality and revenue quality so coaching targets persuasion gaps.",
    owner: "CEO/T&Q",
    due: "Next review"
  }
];

const conversionTrend = [
  { day: "Mon", conversion: 17.46, rejection: 36.2, quality: 83.1 },
  { day: "Tue", conversion: 18.0, rejection: 37.7, quality: 83.8 },
  { day: "Wed", conversion: 16.65, rejection: 39.9, quality: 82.4 },
  { day: "Thu", conversion: 19.37, rejection: 34.2, quality: 85.1 },
  { day: "Fri", conversion: 20.1, rejection: 36.0, quality: 86.3 },
  { day: "Sat", conversion: 19.3, rejection: 33.1, quality: 85.8 },
  { day: "Sun", conversion: 19.74, rejection: 31.9, quality: 86.9 }
];

const actionQueue = [
  { action: "Launch objection-handling huddle", severity: "CRITICAL", owner: "Trainer", impactedAgents: 12, expectedImpact: "+2.4 pp conversion" },
  { action: "Create live alert for price-before-value", severity: "HIGH", owner: "QA Tech", impactedAgents: 34, expectedImpact: "Reduce price rejection by 18%" },
  { action: "Publish best-call snippets", severity: "MEDIUM", owner: "Quality Lead", impactedAgents: 78, expectedImpact: "Standardize winning pitch" },
  { action: "Recalibrate sales audit framework", severity: "HIGH", owner: "T&Q Head", impactedAgents: 100, expectedImpact: "Separate compliance vs revenue quality" }
];

router.get("/dashboard", (_req, res) => {
  const totalCalls = processScorecards.reduce((sum, row) => sum + row.calls, 0);
  const revenue = processScorecards.reduce((sum, row) => sum + row.revenue, 0);
  const salesProcesses = processScorecards.filter((r) => r.conversion > 0);
  const avgConversion = Number(
    (salesProcesses.reduce((sum, row) => sum + row.conversion, 0) / (salesProcesses.length || 1)).toFixed(2)
  );
  const avgQuality = Number((processScorecards.reduce((sum, row) => sum + row.quality, 0) / processScorecards.length).toFixed(2));

  res.json({
    success: true,
    generatedAt: new Date().toISOString(),
    data: {
      kpis: {
        totalCalls,
        totalRevenue: revenue,
        avgConversion,
        avgQuality,
        criticalInsights: insightCards.filter((i) => i.severity === "CRITICAL").length,
        activeRisks: insightCards.length,
        liveAssistCoverage: 73.4,
        coachableLeakage: 84.6
      },
      processScorecards,
      insightCards,
      conversionTrend,
      actionQueue
    }
  });
});

router.get("/gaps", (_req, res) => {
  res.json({
    success: true,
    data: [
      { area: "Real-time architecture", gap: "No WebSocket/SSE live call stream currently proven", priority: "P0", fix: "Add live session gateway, chunked transcript events and next-best-action stream" },
      { area: "Enterprise tenancy", gap: "Process access exists, but full tenant/client isolation is not yet a SaaS-grade boundary", priority: "P0", fix: "Introduce tenant_id, client_id scoping, row-level policy checks and audit logs" },
      { area: "AI governance", gap: "Prompt/version/model confidence tracking needs stronger governance workflow", priority: "P0", fix: "Track prompt version, model, token cost, schema status, reviewer override and variance" },
      { area: "Analytics depth", gap: "Current funnel is snapshot-based, not transition/revenue leakage based", priority: "P0", fix: "Add sales/rejection transition facts, Sankey-ready stage tables and loss attribution" },
      { area: "Production readiness", gap: "Needs rate limiting, monitoring, error tracking, load testing and runbooks", priority: "P1", fix: "Add observability stack, UAT pack and deployment checklist enforcement" },
      { area: "Demo polish", gap: "Single large frontend file and basic CSS limit premium SaaS experience", priority: "P1", fix: "Introduce premium design system, reusable visual components and executive command center" }
    ]
  });
});

export default router;
