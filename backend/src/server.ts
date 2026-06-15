import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import healthRoutes from "./modules/health/health.routes";
import authRoutes from "./modules/auth/auth.routes";
import processRoutes from "./modules/processes/process.routes";
import masterRoutes from "./modules/master/master.routes";
import callsRoutes from "./modules/calls/calls.routes";
import outboundRoutes from "./modules/outbound/outbound.routes";
import inboundRoutes from "./modules/inbound/inbound.routes";
import agentsRoutes from "./modules/agents/agents.routes";
import exportRoutes from "./modules/export/export.routes";
import coachingRoutes from "./modules/coaching/coaching.routes";
import governanceRoutes from "./modules/governance/governance.routes";
import diagnosticsRoutes from "./modules/diagnostics/diagnostics.routes";
import metricsRoutes from "./modules/metrics/metrics.routes";
import executiveRoutes from "./modules/executive/executive.routes";
import funnelRoutes from "./modules/funnels/funnels.routes";
import liveRoutes from "./modules/live/live.routes";
import { authenticateToken, requireProcessAccess } from "./middleware/auth";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "Call Master Enterprise IQ API",
    status: "running",
    modules: [
      "executive-insights",
      "sales-transition-funnel",
      "rejection-transition-funnel",
      "live-assist",
      "audit-360",
      "coaching",
      "governance"
    ]
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/processes", authenticateToken, processRoutes);
app.use("/api/master", authenticateToken, masterRoutes);
app.use("/api/calls", authenticateToken, requireProcessAccess, callsRoutes);
app.use("/api/outbound", authenticateToken, requireProcessAccess, outboundRoutes);
app.use("/api/inbound", authenticateToken, requireProcessAccess, inboundRoutes);
app.use("/api/agents", authenticateToken, requireProcessAccess, agentsRoutes);
app.use("/api/export", authenticateToken, requireProcessAccess, exportRoutes);
app.use("/api/coaching", authenticateToken, coachingRoutes);
app.use("/api/governance", authenticateToken, governanceRoutes);
app.use("/api/diagnostics", authenticateToken, diagnosticsRoutes);
app.use("/api/metrics", authenticateToken, metricsRoutes);
app.use("/api/executive", authenticateToken, executiveRoutes);
app.use("/api/funnels", authenticateToken, requireProcessAccess, funnelRoutes);
app.use("/api/live", authenticateToken, liveRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`Call Master Enterprise IQ API running on http://localhost:${port}`);
});
