import { Router } from "express";

const router = Router();

const today = [
  { time: "10:00", title: "Sales leakage coaching", agent: "Rohan Verma", owner: "Trainer", status: "SCHEDULED", trigger: "Objection handled leakage" },
  { time: "12:30", title: "Rejection recovery role-play", agent: "Kabir Sharma", owner: "TL", status: "SCHEDULED", trigger: "Price objection spike" },
  { time: "16:00", title: "QA calibration", agent: "QA Team", owner: "QA Lead", status: "SCHEDULED", trigger: "Variance review" }
];

const overdue = [
  { title: "Opening trust script recertification", agent: "Bottom quartile group", owner: "Trainer", due: "Yesterday", status: "MISSED" }
];

router.get("/today", (_req, res) => {
  res.json({ success: true, source: "demo_fallback", data: today });
});

router.get("/overdue", (_req, res) => {
  res.json({ success: true, source: "demo_fallback", data: overdue });
});

router.get("/readiness", (_req, res) => {
  res.json({
    success: true,
    data: [
      { check: "Calendar event table", status: "PROPOSED", detail: "cm_coaching_calendar_event proposed." },
      { check: "Assignment link", status: "PARTIAL", detail: "coaching_assignment exists; link needs enforcement." },
      { check: "Reminder log", status: "NEXT", detail: "Add reminder delivery and acknowledgement logs." }
    ]
  });
});

export default router;
