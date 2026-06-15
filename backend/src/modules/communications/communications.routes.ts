import { Router } from "express";

const router = Router();

const templates = [
  { code: "EXEC_DAILY_SUMMARY", page: "Executive IQ", audience: "CEO, T&Q, Ops", status: "DRAFT", subject: "Daily Call Master Executive IQ Summary" },
  { code: "SALES_LEAKAGE_ALERT", page: "Sales Funnel", audience: "Ops, QA, Trainer, TL", status: "DRAFT", subject: "Critical Sales Funnel Leakage Detected" },
  { code: "REJECTION_SPIKE_ALERT", page: "Rejection Funnel", audience: "Ops, QA, Trainer, TL", status: "DRAFT", subject: "Customer Rejection Spike Detected" },
  { code: "LIVE_ASSIST_RISK_ALERT", page: "Live Assist", audience: "Supervisor, QA, TL", status: "DRAFT", subject: "Live Call Risk Alert" },
  { code: "COACHING_ASSIGNMENT", page: "Coaching Calendar", audience: "Agent, TL, Trainer", status: "DRAFT", subject: "Coaching Assigned - Action Required" }
];

router.get("/templates", (_req, res) => {
  res.json({ success: true, source: "demo_fallback", data: templates });
});

router.get("/readiness", (_req, res) => {
  res.json({
    success: true,
    data: [
      { check: "Template master", status: "PROPOSED", detail: "cm_email_template_master proposed." },
      { check: "Template versioning", status: "PROPOSED", detail: "cm_email_template_version proposed." },
      { check: "Communication event log", status: "PROPOSED", detail: "cm_email_event_log proposed." },
      { check: "Provider integration", status: "NEXT", detail: "SMTP or provider integration pending." }
    ]
  });
});

export default router;
