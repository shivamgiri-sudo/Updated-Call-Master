import { Router } from "express";

const router = Router();

const bestCalls = [
  {
    callId: "CALL-FIN-88421",
    process: "FINNABLE",
    agent: "Aarav Singh",
    stage: "Price & urgency explained",
    conversion: "Sale done",
    quality: 96.4,
    snippet: "Customer raised price concern; agent linked benefit to customer risk and explained discount after value.",
    coachingUse: "Value-before-price example",
    duration: "04:12",
    tags: ["price objection", "benefit mapping", "closing"]
  },
  {
    callId: "CALL-INS-11882",
    process: "INSURANCE-UPSELL",
    agent: "Meera Khan",
    stage: "Buying signal captured",
    conversion: "Verified sale",
    quality: 97.8,
    snippet: "Agent identified activation-time question as buying signal and moved to consent cleanly.",
    coachingUse: "Buying signal recognition",
    duration: "05:06",
    tags: ["buying signal", "consent", "high conversion"]
  },
  {
    callId: "CALL-RET-55620",
    process: "RETENTION",
    agent: "Priya Nair",
    stage: "Rebuttal recovery",
    conversion: "Saved customer",
    quality: 94.2,
    snippet: "Agent acknowledged cancellation intent, probed reason, and matched retention benefit to pain point.",
    coachingUse: "Acknowledge-probe-rebuttal framework",
    duration: "06:33",
    tags: ["retention", "rebuttal", "customer save"]
  }
];

const playlists = [
  { name: "Winning openings", calls: 18, owner: "Training", completionRate: 76, targetAudience: "New agents" },
  { name: "Price objection mastery", calls: 22, owner: "Quality", completionRate: 64, targetAudience: "Bottom quartile" },
  { name: "Rebuttal recovery", calls: 16, owner: "Ops + Training", completionRate: 58, targetAudience: "Retention teams" },
  { name: "Compliance-perfect closes", calls: 12, owner: "QA", completionRate: 82, targetAudience: "All sales" }
];

router.get("/best-calls", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: bestCalls });
});

router.get("/playlists", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: playlists });
});

export default router;
