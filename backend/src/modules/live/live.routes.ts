import { Router } from "express";

const router = Router();

const liveEvents = [
  { ts: "00:08", type: "OPENING", severity: "PASS", title: "Opening completed", message: "Agent introduced self and brand clearly.", confidence: 94 },
  { ts: "00:24", type: "INTENT", severity: "INFO", title: "Customer intent detected", message: "Customer is willing to listen but needs price clarity.", confidence: 88 },
  { ts: "00:41", type: "RISK", severity: "HIGH", title: "Price mentioned before value", message: "Coach live: explain benefit before discount.", confidence: 91 },
  { ts: "01:12", type: "OBJECTION", severity: "CRITICAL", title: "Objection: too expensive", message: "Suggested rebuttal: acknowledge price, map benefit, then explain limited-period discount.", confidence: 93 },
  { ts: "01:44", type: "BUYING_SIGNAL", severity: "HIGH", title: "Buying signal detected", message: "Customer asked about activation time. Recommend moving to reconfirmation.", confidence: 87 },
  { ts: "02:05", type: "COMPLIANCE", severity: "MEDIUM", title: "Disclosure pending", message: "Mandatory consent disclosure not completed yet.", confidence: 86 },
  { ts: "02:31", type: "CLOSING", severity: "PASS", title: "Close attempted", message: "Agent asked for consent and next step confirmation.", confidence: 92 }
];

const liveChecklist = [
  { item: "Greeting & brand introduction", status: "PASS", score: 10, evidence: "Good morning, this is Aarav calling from..." },
  { item: "Need discovery", status: "PARTIAL", score: 6, evidence: "Agent asked one probing question but did not validate need." },
  { item: "Benefit explanation", status: "FAIL", score: 3, evidence: "Offer explained before customer benefit mapping." },
  { item: "Objection handling", status: "PARTIAL", score: 6, evidence: "Acknowledged objection but skipped follow-up probing." },
  { item: "Compliance disclosure", status: "PENDING", score: 0, evidence: "Required disclosure not heard yet." },
  { item: "Closing / reconfirmation", status: "PASS", score: 9, evidence: "Agent confirmed interest and next step." }
];

const transcript = [
  { chunkId: 1, speaker: "Agent", ts: "00:03", text: "Good morning, this is Aarav calling regarding your premium upgrade option." },
  { chunkId: 2, speaker: "Customer", ts: "00:18", text: "Okay, but I do not want anything expensive." },
  { chunkId: 3, speaker: "Agent", ts: "00:31", text: "This plan is available with a special discount today." },
  { chunkId: 4, speaker: "Customer", ts: "00:45", text: "What is the actual benefit for me?" },
  { chunkId: 5, speaker: "Agent", ts: "01:02", text: "You will get higher coverage and priority service, which reduces your out-of-pocket risk." },
  { chunkId: 6, speaker: "Customer", ts: "01:23", text: "That sounds useful. How soon can it activate?" },
  { chunkId: 7, speaker: "Agent", ts: "01:48", text: "It can be activated after your confirmation. I will also explain the terms before closing." }
];

const pipeline = [
  { stage: "Audio intake", status: "PARTIAL", targetLatency: "0-3 sec", currentMode: "Requires telephony/recording stream integration" },
  { stage: "Speech-to-text chunking", status: "DESIGNED", targetLatency: "3-8 sec", currentMode: "Use cm_live_transcript_chunk" },
  { stage: "PII masking", status: "REQUIRED", targetLatency: "Before AI call", currentMode: "Must enforce before production AI" },
  { stage: "Rule engine", status: "READY", targetLatency: "Under 5 sec", currentMode: "Can run on chunks" },
  { stage: "Next best action", status: "DESIGNED", targetLatency: "10-30 sec", currentMode: "Use cm_live_assist_event" },
  { stage: "Supervisor whisper", status: "BACKLOG", targetLatency: "Under 10 sec", currentMode: "Needs supervisor routing" },
  { stage: "Post-call audit", status: "READY", targetLatency: "60-90 sec after call", currentMode: "Use AI audit result tables" }
];

const readiness = [
  { check: "Live UI demo", status: "PASS", detail: "Demo session, events, checklist and recommendations exist." },
  { check: "App-owned live tables", status: "PASS", detail: "cm_live_session, cm_live_transcript_chunk and cm_live_assist_event proposed." },
  { check: "Telephony stream", status: "GAP", detail: "Production audio/transcript streaming integration still required." },
  { check: "PII masking", status: "GAP", detail: "Must be enforced before sending chunks to AI." },
  { check: "WebSocket/SSE gateway", status: "GAP", detail: "Needed for real-time browser updates." },
  { check: "Supervisor queue", status: "PARTIAL", detail: "Events can be created; routing rules still required." }
];

function demoPayload() {
  return {
    session: {
      sessionId: "LIVE-FIN-20260616-001",
      processCode: "FINNABLE",
      agent: "Aarav Singh",
      team: "Noida - Sales A",
      callStatus: "LIVE",
      duration: "02:42",
      customerMood: "Interested but price-sensitive",
      liveScore: 72,
      predictedOutcome: "Recoverable sale",
      nextBestAction: "Complete benefit-to-price bridge, then reconfirm consent and activation timeline."
    },
    transcript,
    events: liveEvents,
    checklist: liveChecklist,
    recommendations: [
      "Ask one follow-up question before giving the final discount.",
      "Use customer concern to personalize benefit: cost protection, faster service, peace of mind.",
      "Complete mandatory disclosure before final confirmation.",
      "Move to close because customer asked activation timeline."
    ],
    pipeline,
    readiness,
    source: "partial_production_contract"
  };
}

router.get("/demo", (_req, res) => {
  res.json({ success: true, generatedAt: new Date().toISOString(), data: demoPayload() });
});

router.get("/sessions", (_req, res) => {
  res.json({
    success: true,
    source: "demo_fallback",
    data: [
      { sessionId: "LIVE-FIN-20260616-001", processCode: "FINNABLE", agent: "Aarav Singh", status: "LIVE", liveScore: 72, risk: "HIGH", duration: "02:42", nextAction: "Benefit-to-price bridge" },
      { sessionId: "LIVE-INS-20260616-014", processCode: "INSURANCE-UPSELL", agent: "Meera Khan", status: "LIVE", liveScore: 88, risk: "LOW", duration: "04:18", nextAction: "Move to consent" },
      { sessionId: "LIVE-RET-20260616-009", processCode: "RETENTION", agent: "Rohan Verma", status: "LIVE", liveScore: 61, risk: "CRITICAL", duration: "03:09", nextAction: "Supervisor whisper" }
    ]
  });
});

router.get("/pipeline", (_req, res) => {
  res.json({ success: true, source: "partial_production_contract", generatedAt: new Date().toISOString(), data: pipeline });
});

router.get("/readiness", (_req, res) => {
  res.json({ success: true, source: "partial_production_contract", generatedAt: new Date().toISOString(), data: readiness });
});

router.get("/events/:sessionId", (req, res) => {
  res.json({ success: true, source: "demo_fallback", sessionId: req.params.sessionId, data: liveEvents });
});

router.get("/transcript/:sessionId", (req, res) => {
  res.json({ success: true, source: "demo_fallback", sessionId: req.params.sessionId, data: transcript });
});

export default router;
