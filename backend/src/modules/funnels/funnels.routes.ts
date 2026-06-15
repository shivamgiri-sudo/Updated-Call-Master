import { Router } from "express";

const router = Router();

type FunnelStage = {
  key: string;
  label: string;
  count: number;
  previousConversion: number;
  totalConversion: number;
  leakage: number;
  leakageReason: string;
  coachableImpact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

const salesStages: FunnelStage[] = [
  { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
  { key: "opening_attempted", label: "Opening attempted", count: 12190, previousConversion: 94.94, totalConversion: 94.94, leakage: 650, leakageReason: "Agent skipped structured opening", coachableImpact: "HIGH" },
  { key: "opening_accepted", label: "Opening accepted", count: 10984, previousConversion: 90.11, totalConversion: 85.55, leakage: 1206, leakageReason: "Low trust opening / rushed greeting", coachableImpact: "HIGH" },
  { key: "need_identified", label: "Need identified", count: 9388, previousConversion: 85.47, totalConversion: 73.12, leakage: 1596, leakageReason: "Weak probing before pitch", coachableImpact: "CRITICAL" },
  { key: "offer_explained", label: "Offer explained", count: 8122, previousConversion: 86.51, totalConversion: 63.25, leakage: 1266, leakageReason: "Feature-led pitch without customer linkage", coachableImpact: "HIGH" },
  { key: "benefit_delivered", label: "Benefit delivered", count: 6844, previousConversion: 84.27, totalConversion: 53.3, leakage: 1278, leakageReason: "Benefit not personalized", coachableImpact: "CRITICAL" },
  { key: "price_urgency", label: "Price & urgency explained", count: 5716, previousConversion: 83.52, totalConversion: 44.52, leakage: 1128, leakageReason: "Discount/urgency not framed clearly", coachableImpact: "HIGH" },
  { key: "objection_handled", label: "Objection handled", count: 4238, previousConversion: 74.14, totalConversion: 33.01, leakage: 1478, leakageReason: "Rebuttal not aligned to objection", coachableImpact: "CRITICAL" },
  { key: "buying_signal", label: "Buying signal", count: 3194, previousConversion: 75.37, totalConversion: 24.88, leakage: 1044, leakageReason: "Agent missed closing signal", coachableImpact: "CRITICAL" },
  { key: "consent", label: "Consent / reconfirmation", count: 2762, previousConversion: 86.47, totalConversion: 21.51, leakage: 432, leakageReason: "Incomplete reconfirmation", coachableImpact: "MEDIUM" },
  { key: "sale_done", label: "Sale done", count: 2384, previousConversion: 86.31, totalConversion: 18.57, leakage: 378, leakageReason: "Last-mile hesitation", coachableImpact: "MEDIUM" },
  { key: "verified_sale", label: "Verified sale", count: 2216, previousConversion: 92.95, totalConversion: 17.26, leakage: 168, leakageReason: "Verification / fulfilment leakage", coachableImpact: "LOW" }
];

const rejectionStages: FunnelStage[] = [
  { key: "connected", label: "Connected calls", count: 12840, previousConversion: 100, totalConversion: 100, leakage: 0, leakageReason: "Base connected universe", coachableImpact: "LOW" },
  { key: "opening_rejected", label: "Opening rejected", count: 1856, previousConversion: 14.45, totalConversion: 14.45, leakage: 1856, leakageReason: "Customer disconnected or refused early", coachableImpact: "MEDIUM" },
  { key: "offer_rejected_before", label: "Offer rejected before explanation", count: 1642, previousConversion: 88.47, totalConversion: 12.79, leakage: 214, leakageReason: "Agent failed to earn permission", coachableImpact: "HIGH" },
  { key: "offer_rejected_after", label: "Offer rejected after listening", count: 2968, previousConversion: 180.75, totalConversion: 23.12, leakage: 1326, leakageReason: "Value proposition unclear", coachableImpact: "CRITICAL" },
  { key: "price_objection", label: "Price / discount objection", count: 2324, previousConversion: 78.3, totalConversion: 18.1, leakage: 644, leakageReason: "Price framed before value", coachableImpact: "CRITICAL" },
  { key: "product_mismatch", label: "Product not suitable", count: 1188, previousConversion: 51.12, totalConversion: 9.25, leakage: 1136, leakageReason: "Need discovery incomplete", coachableImpact: "HIGH" },
  { key: "competitor", label: "Competitor preference", count: 726, previousConversion: 61.11, totalConversion: 5.65, leakage: 462, leakageReason: "No differentiation rebuttal", coachableImpact: "HIGH" },
  { key: "trust_concern", label: "Trust / brand concern", count: 608, previousConversion: 83.75, totalConversion: 4.74, leakage: 118, leakageReason: "Trust marker missed", coachableImpact: "HIGH" },
  { key: "rebuttal_failed", label: "Rebuttal failed", count: 2410, previousConversion: 396.38, totalConversion: 18.77, leakage: 1802, leakageReason: "Generic rebuttal or no second attempt", coachableImpact: "CRITICAL" },
  { key: "followup_required", label: "Follow-up required", count: 1318, previousConversion: 54.69, totalConversion: 10.26, leakage: 1092, leakageReason: "Callback commitment but no closure", coachableImpact: "MEDIUM" },
  { key: "final_lost", label: "Final lost", count: 4982, previousConversion: 377.99, totalConversion: 38.8, leakage: 3664, leakageReason: "Unrecovered rejection", coachableImpact: "CRITICAL" }
];

const transitionTrends = [
  { day: "Mon", connected: 2050, sales: 358, rejection: 742, conversion: 17.46 },
  { day: "Tue", connected: 2144, sales: 386, rejection: 808, conversion: 18.0 },
  { day: "Wed", connected: 1988, sales: 331, rejection: 794, conversion: 16.65 },
  { day: "Thu", connected: 2220, sales: 430, rejection: 760, conversion: 19.37 },
  { day: "Fri", connected: 2328, sales: 468, rejection: 838, conversion: 20.1 },
  { day: "Sat", connected: 1264, sales: 244, rejection: 418, conversion: 19.3 },
  { day: "Sun", connected: 846, sales: 167, rejection: 270, conversion: 19.74 }
];

const agentImpact = [
  { agent: "Aarav Singh", team: "Noida - Sales A", calls: 428, conversion: 24.8, rejection: 31.4, leakageStage: "Need identified", quality: 91.2, action: "Use as best-call library sample" },
  { agent: "Meera Khan", team: "Ahmedabad - Sales B", calls: 386, conversion: 22.4, rejection: 35.8, leakageStage: "Price & urgency", quality: 88.7, action: "Promote winning urgency pitch" },
  { agent: "Rohan Verma", team: "Noida - Sales C", calls: 512, conversion: 13.9, rejection: 48.6, leakageStage: "Objection handled", quality: 72.5, action: "Critical objection-handling coaching" },
  { agent: "Priya Nair", team: "Noida - Sales A", calls: 304, conversion: 20.6, rejection: 37.1, leakageStage: "Benefit delivered", quality: 84.4, action: "Refine benefit personalization" },
  { agent: "Kabir Sharma", team: "Ahmedabad - Sales C", calls: 456, conversion: 12.1, rejection: 51.2, leakageStage: "Opening accepted", quality: 68.8, action: "Opening trust script recertification" }
];

const leakageReasons = [
  { reason: "Weak need discovery", calls: 1596, missedRevenue: 3192000, coachable: 92, severity: "CRITICAL" },
  { reason: "Generic objection rebuttal", calls: 1478, missedRevenue: 2956000, coachable: 88, severity: "CRITICAL" },
  { reason: "Benefit not personalized", calls: 1278, missedRevenue: 2556000, coachable: 91, severity: "CRITICAL" },
  { reason: "Offer explained without urgency", calls: 1128, missedRevenue: 2256000, coachable: 77, severity: "HIGH" },
  { reason: "Missed buying signal", calls: 1044, missedRevenue: 2088000, coachable: 84, severity: "CRITICAL" },
  { reason: "Incomplete reconfirmation", calls: 432, missedRevenue: 864000, coachable: 64, severity: "MEDIUM" }
];

const rejectionReasons = [
  { reason: "Not interested", calls: 1420, trend: 18.2, coachable: 54, action: "Improve permission-based opening" },
  { reason: "Price too high", calls: 1164, trend: 24.5, coachable: 82, action: "Value-before-price coaching" },
  { reason: "Already using competitor", calls: 726, trend: 11.4, coachable: 76, action: "Competitor differentiation playbook" },
  { reason: "Call me later", calls: 650, trend: -4.2, coachable: 63, action: "Callback commitment script" },
  { reason: "Trust concern", calls: 608, trend: 9.6, coachable: 79, action: "Trust-marker insertion" },
  { reason: "Product mismatch", calls: 1188, trend: 16.8, coachable: 68, action: "Improve need diagnosis" }
];

router.get("/:processCode/sales-transition", (req, res) => {
  res.json({
    success: true,
    processCode: req.params.processCode,
    generatedAt: new Date().toISOString(),
    data: {
      kpis: {
        connectedCalls: 12840,
        salesDone: 2384,
        verifiedSales: 2216,
        conversionPercent: 18.57,
        verifiedConversionPercent: 17.26,
        estimatedRevenue: 4432000,
        missedRevenue: 13112000,
        highestLeakageStage: "Need identified → Offer explained",
        coachableLeakagePercent: 84.6
      },
      stages: salesStages,
      trends: transitionTrends,
      leakageReasons,
      agentImpact
    }
  });
});

router.get("/:processCode/rejection-transition", (req, res) => {
  res.json({
    success: true,
    processCode: req.params.processCode,
    generatedAt: new Date().toISOString(),
    data: {
      kpis: {
        connectedCalls: 12840,
        finalLost: 4982,
        rejectionPercent: 38.8,
        coachableRejectionPercent: 76.4,
        highestRejectionReason: "Price too high after offer explanation",
        recoveryCandidates: 1318,
        estimatedRecoverableRevenue: 2636000
      },
      stages: rejectionStages,
      trends: transitionTrends,
      rejectionReasons,
      agentImpact
    }
  });
});

router.get("/:processCode/leakage", (req, res) => {
  res.json({ success: true, processCode: req.params.processCode, data: leakageReasons });
});

router.get("/:processCode/stage-agents", (req, res) => {
  res.json({ success: true, processCode: req.params.processCode, data: agentImpact });
});

export default router;
