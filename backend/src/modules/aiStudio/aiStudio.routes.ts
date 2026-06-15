import { Router } from "express";

const router = Router();

const promptVersions = [
  {
    promptId: "PROMPT-SALES-001",
    name: "Outbound Sales Audit v3.2",
    process: "FINNABLE",
    status: "ACTIVE",
    model: "Enterprise LLM Router",
    schemaStatus: "VALID",
    avgConfidence: 91.4,
    tokenCostToday: 1840,
    humanOverrideRate: 4.8,
    lastCalibrated: "2026-06-15"
  },
  {
    promptId: "PROMPT-REJECTION-002",
    name: "Customer Rejection Classifier v2.1",
    process: "FINNABLE",
    status: "ACTIVE",
    model: "Enterprise LLM Router",
    schemaStatus: "VALID",
    avgConfidence: 89.7,
    tokenCostToday: 980,
    humanOverrideRate: 6.2,
    lastCalibrated: "2026-06-14"
  },
  {
    promptId: "PROMPT-LIVE-003",
    name: "Live Assist Next Best Action v1.0",
    process: "All Sales",
    status: "PILOT",
    model: "Low-latency LLM",
    schemaStatus: "VALID",
    avgConfidence: 86.1,
    tokenCostToday: 620,
    humanOverrideRate: 8.6,
    lastCalibrated: "2026-06-13"
  },
  {
    promptId: "PROMPT-COMPLIANCE-004",
    name: "Sensitive Word & Compliance Guardrail",
    process: "All Processes",
    status: "ACTIVE",
    model: "Rules + LLM verifier",
    schemaStatus: "VALID",
    avgConfidence: 94.8,
    tokenCostToday: 410,
    humanOverrideRate: 2.1,
    lastCalibrated: "2026-06-15"
  }
];

const frameworkParameters = [
  { category: "Opening", parameter: "Brand introduction", weight: 10, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Discovery", parameter: "Need identification", weight: 15, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Sales", parameter: "Benefit personalization", weight: 15, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Sales", parameter: "Price after value", weight: 12, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Objection", parameter: "Acknowledge and probe", weight: 14, fatal: false, liveAssist: true, evidenceRequired: true },
  { category: "Compliance", parameter: "Mandatory disclosure", weight: 20, fatal: true, liveAssist: true, evidenceRequired: true },
  { category: "Closing", parameter: "Consent and reconfirmation", weight: 14, fatal: false, liveAssist: true, evidenceRequired: true }
];

const governanceCards = [
  { metric: "Prompt versions active", value: 4, status: "CONTROLLED", note: "All active prompts have schema validation." },
  { metric: "Avg AI confidence", value: "90.5%", status: "HEALTHY", note: "Above enterprise threshold of 85%." },
  { metric: "Human override rate", value: "5.4%", status: "WATCH", note: "Review rejection classifier overrides weekly." },
  { metric: "Daily token cost", value: "₹3,850", status: "HEALTHY", note: "Within configured budget guardrail." },
  { metric: "Calibration variance", value: "2.8%", status: "HEALTHY", note: "Below 3% target variance." }
];

router.get("/prompts", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: promptVersions });
});

router.get("/framework", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: frameworkParameters });
});

router.get("/governance", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: governanceCards });
});

export default router;
