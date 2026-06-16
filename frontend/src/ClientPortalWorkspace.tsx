import React, { useEffect, useState } from "react";
import { apiGet } from "./services/api";

type ApiResponse<T> = { success: boolean; data: T; source?: string; warning?: string };

const fallback = {
  users: [
    { client: "Demo Client", email: "client.viewer@example.com", displayName: "Client Viewer", role: "CLIENT_VIEWER", status: "ACTIVE" },
    { client: "Demo Client", email: "client.admin@example.com", displayName: "Client Admin", role: "CLIENT_ADMIN", status: "ACTIVE" }
  ],
  permissions: [
    { role: "CLIENT_VIEWER", module: "executive_iq", canView: true, canExport: false, canComment: false, canDownloadRaw: false },
    { role: "CLIENT_ADMIN", module: "sales_funnel", canView: true, canExport: true, canComment: true, canDownloadRaw: false }
  ],
  shares: [
    { module: "executive_iq", sharedTo: "client.viewer@example.com", status: "PENDING", expiresAt: "7 days" }
  ],
  approvalQueue: [
    { requestId: "SHARE-001", module: "executive_iq", requestedBy: "Ops Manager", sharedTo: "client.viewer@example.com", status: "PENDING_APPROVAL", risk: "LOW" }
  ],
  watermarkPolicy: [
    { exportType: "PDF", watermark: "tenant, user email, timestamp, module", enabled: true },
    { exportType: "RAW_TRANSCRIPT", watermark: "blocked for client roles", enabled: false }
  ],
  accessAudit: [
    { event: "VIEW", module: "executive_iq", user: "client.viewer@example.com", status: "ALLOWED", at: "Recent" }
  ],
  ssoMfa: [
    { check: "SSO provider config", status: "NEXT", detail: "Add provider metadata and callback URL." },
    { check: "MFA enforcement", status: "NEXT", detail: "Require MFA for admin and client portal roles." }
  ]
};

function Badge({ value }: { value: unknown }) {
  return <span className={`badge ${String(value).toLowerCase().replace(/\s+/g, "-")}`}>{String(value)}</span>;
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return <div className="section-title"><h3>{title}</h3><span>{sub}</span></div>;
}

function KpiCard({ label, value, sub, tone = "" }: { label: string; value: React.ReactNode; sub?: string; tone?: string }) {
  return <div className={`kpi-card ${tone}`}><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div>{sub && <div className="kpi-sub">{sub}</div>}</div>;
}

function DataTable({ columns, rows }: { columns: string[]; rows: any[] }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{(rows || []).map((row, idx) => <tr key={idx}>{columns.map((c) => {
    const value = row[c] ?? row[c.toLowerCase()] ?? row[c.replace(/([A-Z])/g, "_$1").toLowerCase()] ?? "-";
    return <td key={c}>{typeof value === "boolean" ? <Badge value={value ? "YES" : "NO"} /> : ["ACTIVE", "PENDING", "PENDING_APPROVAL", "ALLOWED", "BLOCKED", "NEXT", "PARTIAL", "LOW", "MEDIUM", "HIGH"].includes(String(value)) ? <Badge value={value} /> : String(value)}</td>;
  })}</tr>)}</tbody></table></div>;
}

export default function ClientPortalWorkspace() {
  const [state, setState] = useState({ ...fallback, source: "demo_fallback" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [users, permissions, shares, approvalQueue, watermarkPolicy, accessAudit, ssoMfa] = await Promise.all([
          apiGet<ApiResponse<any[]>>("/api/client-portal/users"),
          apiGet<ApiResponse<any[]>>("/api/client-portal/permissions"),
          apiGet<ApiResponse<any[]>>("/api/client-portal/shares"),
          apiGet<ApiResponse<any[]>>("/api/client-portal/approval-queue"),
          apiGet<ApiResponse<any[]>>("/api/client-portal/watermark-policy"),
          apiGet<ApiResponse<any[]>>("/api/client-portal/access-audit"),
          apiGet<ApiResponse<any[]>>("/api/client-portal/sso-mfa-readiness")
        ]);
        if (cancelled) return;
        setState({
          users: users.data || fallback.users,
          permissions: permissions.data || fallback.permissions,
          shares: shares.data || fallback.shares,
          approvalQueue: approvalQueue.data || fallback.approvalQueue,
          watermarkPolicy: watermarkPolicy.data || fallback.watermarkPolicy,
          accessAudit: accessAudit.data || fallback.accessAudit,
          ssoMfa: ssoMfa.data || fallback.ssoMfa,
          source: users.source || permissions.source || shares.source || "api_connected"
        });
      } catch {
        if (!cancelled) setState({ ...fallback, source: "demo_fallback" });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const rawBlocked = state.permissions.filter((p: any) => p.canDownloadRaw === true).length === 0;

  return <>
    <div className={`source-banner ${state.source === "mysql_app_owned" ? "mysql" : "demo"}`}>
      <div><strong>Client Portal source: {state.source}</strong><p>Portal users, permissions, shares, approval queue, watermark policy and audit visibility are API-bound.</p></div>
      <Badge value={state.source} />
    </div>
    <section className="kpi-grid">
      <KpiCard label="Portal users" value={state.users.length} />
      <KpiCard label="Permission rows" value={state.permissions.length} />
      <KpiCard label="Share requests" value={state.shares.length} />
      <KpiCard label="Approvals pending" value={state.approvalQueue.length} tone="gold" />
      <KpiCard label="Raw download" value={rawBlocked ? "Blocked" : "Review"} tone={rawBlocked ? "" : "danger"} />
      <KpiCard label="SSO/MFA" value="Hardening" />
    </section>
    <section className="grid two">
      <div className="card"><SectionTitle title="Portal users" sub="client-facing access" /><DataTable columns={["client", "email", "displayName", "role", "status"]} rows={state.users} /></div>
      <div className="card"><SectionTitle title="Role permission matrix" sub="least-privilege access" /><DataTable columns={["role", "module", "canView", "canExport", "canComment", "canDownloadRaw"]} rows={state.permissions} /></div>
    </section>
    <section className="grid two">
      <div className="card"><SectionTitle title="Share approval queue" sub="approval workflow" /><DataTable columns={["requestId", "module", "requestedBy", "sharedTo", "status", "risk"]} rows={state.approvalQueue} /></div>
      <div className="card"><SectionTitle title="Watermark policy" sub="export protection" /><DataTable columns={["exportType", "watermark", "enabled"]} rows={state.watermarkPolicy} /></div>
    </section>
    <section className="grid two">
      <div className="card"><SectionTitle title="Share log" sub="external sharing" /><DataTable columns={["module", "sharedTo", "status", "expiresAt"]} rows={state.shares} /></div>
      <div className="card"><SectionTitle title="Access audit" sub="portal access trace" /><DataTable columns={["event", "module", "user", "status", "at"]} rows={state.accessAudit} /></div>
    </section>
    <div className="card"><SectionTitle title="SSO / MFA readiness" sub="security hardening" /><DataTable columns={["check", "status", "detail"]} rows={state.ssoMfa} /></div>
  </>;
}
