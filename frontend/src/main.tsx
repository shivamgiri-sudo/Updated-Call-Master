import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { apiGet } from "./services/api";
import "./styles.css";

type ApiResponse<T> = { success: boolean; data: T };

type ProcessRow = {
  process_id: number;
  process_code: string;
  process_name: string;
  process_type: string;
};

type MasterSummary = {
  total_processes: number;
  total_calls: number;
  total_agents: number;
  transcript_available: number;
  ai_audit_completed: number;
  manual_audit_completed: number;
  avg_quality_score: number | null;
  fatal_count: number;
  escalation_count: number;
  coaching_trigger_count: number;
};

type CallRow = {
  call_id: number;
  source_call_id: string;
  process_code: string;
  process_name: string;
  process_type: string;
  source_agent_name: string;
  lead_id: string;
  call_direction: string;
  call_datetime: string;
  duration_sec: number;
  transcript_status: string;
  final_audit_status: string;
};

type AgentRow = {
  source_agent_name: string;
  total_calls: number;
  active_days: number;
  transcript_available: number;
  ai_audit_completed: number;
  manual_audit_completed: number;
  first_call_date: string;
  last_call_date: string;
};

const ROLES = [
  "T&Q Head", "CEO", "QA Auditor", "Trainer", "Ops Manager", "TL", "Agent", "Client", "Admin"
];

const PAGE_ACCESS: Record<string, string[]> = {
  "T&Q Master": ["T&Q Head", "CEO", "Admin"],
  "Process Performance": ["T&Q Head", "CEO", "Ops Manager", "Admin"],
  "Call Audit 360": ["T&Q Head", "QA Auditor", "Trainer", "TL", "Admin"],
  "Outbound Funnel": ["T&Q Head", "CEO", "Ops Manager", "TL", "Admin"],
  "Agent Summary": ["T&Q Head", "Ops Manager", "TL", "Admin"],
  "Coaching": ["T&Q Head", "Trainer", "TL", "Admin"],
  "Governance": ["T&Q Head", "Trainer", "Admin"],
  "Inbound Quality": ["T&Q Head", "QA Auditor", "Admin"],
  "LMS Sync": ["Trainer", "Admin"],
  "Data Diagnostics": ["Admin"],
  "Deployment Checklist": ["Admin"]
};

function KpiCard({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="card kpi">
      <div className="label">{label}</div>
      <div className="value">{value ?? "-"}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function App() {
  const [role, setRole] = useState("Admin");
  const [page, setPage] = useState("T&Q Master");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [processes, setProcesses] = useState<ProcessRow[]>([]);
  const [selectedProcess, setSelectedProcess] = useState("FINNABLE");
  const [summary, setSummary] = useState<MasterSummary | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentCalls, setAgentCalls] = useState<CallRow[]>([]);
  const [audit, setAudit] = useState<any>(null);
  const [outboundFunnel, setOutboundFunnel] = useState<any>(null);
  const [outboundRecent, setOutboundRecent] = useState<any[]>([]);
  const [objections, setObjections] = useState<any[]>([]);
  const [dayWise, setDayWise] = useState<any[]>([]);
  const [processPerf, setProcessPerf] = useState<any[]>([]);
  const [inboundQuality, setInboundQuality] = useState<any>(null);
  const [coachingTriggers, setCoachingTriggers] = useState<any[]>([]);
  const [governanceActions, setGovernanceActions] = useState<any[]>([]);
  const [governanceStats, setGovernanceStats] = useState<any>(null);
  const [availableData, setAvailableData] = useState<any[]>([]);
  const [processDiagnostics, setProcessDiagnostics] = useState<any>(null);
  const [inboundValidation, setInboundValidation] = useState<any>(null);
  const [deploymentChecklist, setDeploymentChecklist] = useState<any>(null);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => processes.find((p) => p.process_code === selectedProcess),
    [processes, selectedProcess]
  );

  const visiblePages = useMemo(
    () => Object.keys(PAGE_ACCESS).filter(p => PAGE_ACCESS[p].includes(role)),
    [role]
  );

  useEffect(() => {
    if (!visiblePages.includes(page)) {
      setPage(visiblePages[0] || "T&Q Master");
    }
  }, [role, page, visiblePages]);

  function loadData() {
    apiGet<ApiResponse<ProcessRow[]>>("/api/processes")
      .then((r) => {
        setProcesses(r.data);
        const first = r.data.find((x) => x.process_code === "FINNABLE") || r.data[0];
        if (first) setSelectedProcess(first.process_code);
      })
      .catch((e) => setError(e.message));

    const summaryUrl = dateFilter ? `/api/master/summary?date=${dateFilter}` : "/api/master/summary";
    apiGet<ApiResponse<MasterSummary>>(summaryUrl)
      .then((r) => setSummary(r.data))
      .catch((e) => setError(e.message));

    apiGet<ApiResponse<any[]>>("/api/master/day-wise-audits")
      .then((r) => setDayWise(r.data))
      .catch(() => setDayWise([]));
  }

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  useEffect(() => {
    if (!selectedProcess) return;

    apiGet<ApiResponse<CallRow[]>>(`/api/calls?processCode=${encodeURIComponent(selectedProcess)}`)
      .then((r) => setCalls(r.data))
      .catch((e) => setError(e.message));

    const funnelUrl = dateFilter
      ? `/api/outbound/${encodeURIComponent(selectedProcess)}/funnel?date=${dateFilter}`
      : `/api/outbound/${encodeURIComponent(selectedProcess)}/funnel`;

    apiGet<ApiResponse<any>>(funnelUrl)
      .then((r) => setOutboundFunnel(r.data))
      .catch(() => setOutboundFunnel(null));

    apiGet<ApiResponse<any[]>>(`/api/outbound/${encodeURIComponent(selectedProcess)}/recent-calls`)
      .then((r) => setOutboundRecent(r.data))
      .catch(() => setOutboundRecent([]));

    apiGet<ApiResponse<any[]>>(`/api/outbound/${encodeURIComponent(selectedProcess)}/objections`)
      .then((r) => setObjections(r.data))
      .catch(() => setObjections([]));

    apiGet<ApiResponse<AgentRow[]>>(`/api/agents/summary?processCode=${encodeURIComponent(selectedProcess)}`)
      .then((r) => setAgents(r.data))
      .catch(() => setAgents([]));

    const perfUrl = dateFilter
      ? `/api/master/process-performance?date=${dateFilter}`
      : "/api/master/process-performance";

    apiGet<ApiResponse<any[]>>(perfUrl)
      .then((r) => setProcessPerf(r.data))
      .catch(() => setProcessPerf([]));

    const inboundUrl = dateFilter
      ? `/api/inbound/${encodeURIComponent(selectedProcess)}/quality?date=${dateFilter}`
      : `/api/inbound/${encodeURIComponent(selectedProcess)}/quality`;

    apiGet<ApiResponse<any>>(inboundUrl)
      .then((r) => setInboundQuality(r.data))
      .catch(() => setInboundQuality(null));

    loadCoaching();
    loadGovernance();
  }, [selectedProcess, dateFilter]);

  useEffect(() => {
    if (page === "Data Diagnostics") {
      apiGet<ApiResponse<any[]>>("/api/diagnostics/available-data")
        .then((r) => setAvailableData(r.data))
        .catch((e) => setError(e.message));

      apiGet<ApiResponse<any>>("/api/diagnostics/inbound-validation")
        .then((r) => setInboundValidation(r.data))
        .catch(() => setInboundValidation(null));
    }

    if (page === "Deployment Checklist") {
      apiGet<ApiResponse<any>>("/api/diagnostics/deployment-checklist")
        .then((r) => setDeploymentChecklist(r.data))
        .catch((e) => setError(e.message));
    }
  }, [page]);

  function loadCoaching() {
    apiGet<ApiResponse<any[]>>(`/api/coaching?processCode=${encodeURIComponent(selectedProcess)}`)
      .then((r) => setCoachingTriggers(r.data))
      .catch(() => setCoachingTriggers([]));
  }

  function loadGovernance() {
    apiGet<ApiResponse<any[]>>(`/api/governance?processCode=${encodeURIComponent(selectedProcess)}`)
      .then((r) => setGovernanceActions(r.data))
      .catch(() => setGovernanceActions([]));

    apiGet<ApiResponse<any>>(`/api/governance/stats?processCode=${encodeURIComponent(selectedProcess)}`)
      .then((r) => setGovernanceStats(r.data))
      .catch(() => setGovernanceStats(null));
  }

  function viewProcessDiagnostics(processCode: string) {
    apiGet<any>(`/api/diagnostics/processes/${encodeURIComponent(processCode)}`)
      .then((r) => setProcessDiagnostics(r.diagnostics))
      .catch((e) => setError(e.message));
  }

  function getStatusColor(status: string): string {
    switch(status) {
      case "READY": return "#d1fae5";
      case "RAW_ONLY": return "#fef3c7";
      case "CANONICAL_ONLY": return "#dbeafe";
      case "NO_DATA": return "#fee2e2";
      default: return "#f1f5f9";
    }
  }

  function getStatusTextColor(status: string): string {
    switch(status) {
      case "READY": return "#065f46";
      case "RAW_ONLY": return "#92400e";
      case "CANONICAL_ONLY": return "#1e40af";
      case "NO_DATA": return "#991b1b";
      default: return "#475569";
    }
  }

  function openAudit(callId: number) {
    apiGet<ApiResponse<any>>(`/api/calls/${callId}/audit360`)
      .then((r) => setAudit(r.data))
      .catch((e) => setError(e.message));
  }

  function openAgent(agentName: string) {
    setSelectedAgent(agentName);
    apiGet<ApiResponse<CallRow[]>>(`/api/agents/${encodeURIComponent(agentName)}/calls?processCode=${encodeURIComponent(selectedProcess)}`)
      .then((r) => setAgentCalls(r.data))
      .catch((e) => setError(e.message));
  }

  function handleDateQuick(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    setDateFilter(formatDate(d));
  }

  function downloadCsv(endpoint: string, filename: string) {
    window.open(`http://localhost:5000${endpoint}`, "_blank");
  }

  async function createCoaching(call: any) {
    try {
      const response = await fetch("http://localhost:5000/api/coaching/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: call.call_id,
          employee_code: call.source_agent_name,
          process_code: call.process_code,
          coaching_topic: "Outbound Sales Coaching",
          priority: "HIGH",
          remarks: call.area_for_improvement || "Area for improvement identified during audit review"
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Coaching trigger created successfully!");
        loadCoaching();
        setAudit(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function updateCoachingStatus(triggerId: number, status: string) {
    try {
      const response = await fetch(`http://localhost:5000/api/coaching/${triggerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        loadCoaching();
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function updateGovernanceStatus(actionId: number, status: string) {
    try {
      const response = await fetch(`http://localhost:5000/api/governance/${actionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        loadGovernance();
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <div className="mark" />
          <div>
            <h1>Call Master</h1>
            <p>Control Tower</p>
          </div>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 900, display: "block", marginBottom: "6px" }}>ROLE</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%" }}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <nav>
          {visiblePages.map((p) => (
            <a key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)} style={{ cursor: "pointer" }}>
              {p}
            </a>
          ))}
        </nav>
      </aside>

      <main>
        <div className="topbar">
          <div>
            <h2>One Call Master Link</h2>
            <p>Inbound + Outbound process routing through process code</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setDateFilter("")} style={{ padding: "6px 10px", fontSize: "12px" }}>Today</button>
            <button onClick={() => handleDateQuick(1)} style={{ padding: "6px 10px", fontSize: "12px" }}>Yesterday</button>
            <button onClick={() => handleDateQuick(7)} style={{ padding: "6px 10px", fontSize: "12px" }}>Last 7D</button>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ padding: "8px", border: "1px solid #d8e6e8", borderRadius: "8px", fontSize: "12px" }}
            />
            <button onClick={loadData} style={{ padding: "8px 12px", background: "#14b8a6" }}>↻ Refresh</button>
            <select value={selectedProcess} onChange={(e) => setSelectedProcess(e.target.value)}>
              {processes.map((p) => (
                <option key={p.process_id} value={p.process_code}>
                  {p.process_name} | {p.process_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {page === "T&Q Master" && (
          <>
            <section className="grid kpis">
              <KpiCard label="Total Processes" value={summary?.total_processes} sub="From summary table" />
              <KpiCard label="Total Calls" value={summary?.total_calls} sub="Latest summary date" />
              <KpiCard label="Agents" value={summary?.total_agents} sub="Summed daily agents" />
              <KpiCard label="Transcripts" value={summary?.transcript_available} sub="Available" />
              <KpiCard label="AI Audit" value={summary?.ai_audit_completed} sub="Completed" />
              <KpiCard label="Manual Audit" value={summary?.manual_audit_completed} sub="Completed" />
            </section>

            <section className="grid two">
              <div className="card">
                <h3>Selected Process</h3>
                <table>
                  <tbody>
                    <tr><td>Process Code</td><td>{selected?.process_code}</td></tr>
                    <tr><td>Process Name</td><td>{selected?.process_name}</td></tr>
                    <tr><td>Process Type</td><td>{selected?.process_type}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3>Outbound Funnel Snapshot</h3>
                <table>
                  <tbody>
                    <tr><td>Total Calls</td><td>{outboundFunnel?.total_calls ?? "-"}</td></tr>
                    <tr><td>Opening Done</td><td>{outboundFunnel?.opening_done_count ?? "-"}</td></tr>
                    <tr><td>Offered</td><td>{outboundFunnel?.offered_count ?? "-"}</td></tr>
                    <tr><td>Sale Done</td><td>{outboundFunnel?.sale_done_count ?? "-"}</td></tr>
                    <tr><td>Conversion %</td><td>{outboundFunnel?.conversion_percent ?? "-"}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h3>Recent Calls</h3>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Call ID</th>
                      <th>Source Call</th>
                      <th>Agent</th>
                      <th>Lead</th>
                      <th>Date</th>
                      <th>Transcript</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((c) => (
                      <tr key={c.call_id}>
                        <td>{c.call_id}</td>
                        <td>{c.source_call_id}</td>
                        <td>{c.source_agent_name}</td>
                        <td>{c.lead_id}</td>
                        <td>{c.call_datetime}</td>
                        <td>{c.transcript_status}</td>
                        <td><button onClick={() => openAudit(c.call_id)}>Audit 360</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === "Process Performance" && (
          <>
            <section className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3>Process Performance Summary</h3>
                <button onClick={() => downloadCsv(`/api/export/process-performance${dateFilter ? `?date=${dateFilter}` : ""}`, "process-performance.csv")}>
                  ⬇ Export CSV
                </button>
              </div>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Process Code</th>
                      <th>Process Name</th>
                      <th>Type</th>
                      <th>Total Calls</th>
                      <th>Agents</th>
                      <th>Transcripts</th>
                      <th>AI Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processPerf.map((p) => (
                      <tr key={p.process_id}>
                        <td>{p.process_code}</td>
                        <td>{p.process_name}</td>
                        <td>{p.process_type}</td>
                        <td>{p.total_calls}</td>
                        <td>{p.agent_count}</td>
                        <td>{p.transcript_available}</td>
                        <td>{p.ai_audit_completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h3>Day-Wise Trend</h3>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Calls</th>
                      <th>Agents</th>
                      <th>Transcripts</th>
                      <th>AI Audit</th>
                      <th>Manual Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayWise.map((d) => (
                      <tr key={d.summary_date}>
                        <td>{d.summary_date}</td>
                        <td>{d.total_calls}</td>
                        <td>{d.agent_count}</td>
                        <td>{d.transcript_available}</td>
                        <td>{d.ai_audit_completed}</td>
                        <td>{d.manual_audit_completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === "Agent Summary" && (
          <>
            <section className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3>Agent Summary for {selectedProcess}</h3>
                <button onClick={() => downloadCsv(`/api/export/agents?processCode=${selectedProcess}`, `agents-${selectedProcess}.csv`)}>
                  ⬇ Export CSV
                </button>
              </div>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Agent Name</th>
                      <th>Total Calls</th>
                      <th>Active Days</th>
                      <th>Transcripts</th>
                      <th>AI Audit</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a) => (
                      <tr key={a.source_agent_name}>
                        <td>{a.source_agent_name}</td>
                        <td>{a.total_calls}</td>
                        <td>{a.active_days}</td>
                        <td>{a.transcript_available}</td>
                        <td>{a.ai_audit_completed}</td>
                        <td><button onClick={() => openAgent(a.source_agent_name)}>View Calls</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedAgent && (
              <section className="card">
                <h3>Calls by {selectedAgent}</h3>
                <div className="scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Call ID</th>
                        <th>Date</th>
                        <th>Duration (sec)</th>
                        <th>Transcript</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentCalls.map((c) => (
                        <tr key={c.call_id}>
                          <td>{c.call_id}</td>
                          <td>{c.call_datetime}</td>
                          <td>{c.duration_sec}</td>
                          <td>{c.transcript_status}</td>
                          <td><button onClick={() => openAudit(c.call_id)}>Audit 360</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {page === "Outbound Funnel" && (
          <>
            <section className="grid two">
              <div className="card">
                <h3>Funnel Metrics</h3>
                <table>
                  <tbody>
                    <tr><td>Total Calls</td><td>{outboundFunnel?.total_calls ?? "-"}</td></tr>
                    <tr><td>Opening Done</td><td>{outboundFunnel?.opening_done_count ?? "-"}</td></tr>
                    <tr><td>Offered</td><td>{outboundFunnel?.offered_count ?? "-"}</td></tr>
                    <tr><td>Objection Handled</td><td>{outboundFunnel?.objection_handled_count ?? "-"}</td></tr>
                    <tr><td>Sale Done</td><td>{outboundFunnel?.sale_done_count ?? "-"}</td></tr>
                    <tr><td>Conversion %</td><td>{outboundFunnel?.conversion_percent ?? "-"}%</td></tr>
                    <tr><td>Offer Conversion %</td><td>{outboundFunnel?.offer_conversion_percent ?? "-"}%</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3>Top Objections</h3>
                  <button onClick={() => downloadCsv(`/api/export/outbound-objections?processCode=${selectedProcess}`, `objections-${selectedProcess}.csv`)} style={{ padding: "6px 8px", fontSize: "11px" }}>
                    ⬇ CSV
                  </button>
                </div>
                <div className="scroll" style={{ maxHeight: "280px" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Calls</th>
                        <th>Conv %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {objections.slice(0, 10).map((o, i) => (
                        <tr key={i}>
                          <td>{o.CustomerObjectionCategory}</td>
                          <td>{o.total_calls}</td>
                          <td>{o.conversion_percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3>Recent Outbound Calls</h3>
                <button onClick={() => downloadCsv(`/api/export/calls?processCode=${selectedProcess}`, `calls-${selectedProcess}.csv`)}>
                  ⬇ Export CSV
                </button>
              </div>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Agent</th>
                      <th>Lead</th>
                      <th>Opening</th>
                      <th>Offered</th>
                      <th>Sale</th>
                      <th>Product</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outboundRecent.slice(0, 50).map((c) => (
                      <tr key={c.id}>
                        <td>{c.CallDate}</td>
                        <td>{c.AgentName}</td>
                        <td>{c.LeadID}</td>
                        <td>{c.Opening || "-"}</td>
                        <td>{c.Offered || "-"}</td>
                        <td>{c.SaleDone || "-"}</td>
                        <td>{c.ProductOffering || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === "Inbound Quality" && (
          <>
            {inboundQuality?.data ? (
              <section className="grid kpis">
                <KpiCard label="Audit Count" value={inboundQuality.data.audit_count} sub="Total audited calls" />
                <KpiCard label="CQ Score" value={inboundQuality.data.cq_score} sub="Avg quality %" />
                <KpiCard label="Sensitive Words" value={inboundQuality.data.sensitive_word_count} sub="Violations detected" />
                <KpiCard label="Policy Failures" value={inboundQuality.data.policy_failure_count} sub="Communication failures" />
              </section>
            ) : (
              <section className="card">
                <h3>Inbound Quality for {selectedProcess}</h3>
                <p style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  No inbound quality data available for this process. Either this is an outbound process or no quality assessments have been recorded yet.
                </p>
              </section>
            )}
          </>
        )}

        {page === "Coaching" && (
          <section className="card">
            <h3>Coaching Triggers for {selectedProcess}</h3>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Trigger ID</th>
                    <th>Call ID</th>
                    <th>Employee</th>
                    <th>Topic</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Triggered At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coachingTriggers.map((ct) => (
                    <tr key={ct.trigger_id}>
                      <td>{ct.trigger_id}</td>
                      <td>{ct.call_id}</td>
                      <td>{ct.employee_code}</td>
                      <td>{ct.coaching_topic}</td>
                      <td><span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: ct.priority === "HIGH" ? "#fee2e2" : ct.priority === "MEDIUM" ? "#fef3c7" : "#e0e7ff",
                        color: ct.priority === "HIGH" ? "#991b1b" : ct.priority === "MEDIUM" ? "#92400e" : "#3730a3",
                        fontSize: "11px",
                        fontWeight: 800
                      }}>{ct.priority}</span></td>
                      <td><span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: ct.status === "COMPLETED" ? "#d1fae5" : ct.status === "ASSIGNED" ? "#dbeafe" : "#fef3c7",
                        color: ct.status === "COMPLETED" ? "#065f46" : ct.status === "ASSIGNED" ? "#1e40af" : "#92400e",
                        fontSize: "11px",
                        fontWeight: 800
                      }}>{ct.status}</span></td>
                      <td>{ct.triggered_at}</td>
                      <td>
                        {ct.status === "PENDING" && (
                          <button onClick={() => updateCoachingStatus(ct.trigger_id, "COMPLETED")} style={{ padding: "6px 10px", fontSize: "12px" }}>
                            Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === "Governance" && (
          <>
            <section className="grid kpis">
              <KpiCard label="Open Actions" value={governanceStats?.open_count || 0} sub="Governance items" />
              <KpiCard label="Closed Actions" value={governanceStats?.closed_count || 0} sub="Completed" />
              <KpiCard label="Overdue" value={governanceStats?.overdue_count || 0} sub="Past due date" />
              <KpiCard label="Total" value={governanceStats?.total_count || 0} sub="All actions" />
            </section>

            <section className="card">
              <h3>Governance Actions for {selectedProcess}</h3>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Owner</th>
                      <th>Employee</th>
                      <th>Priority</th>
                      <th>Due At</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {governanceActions.map((ga) => (
                      <tr key={ga.action_id} style={{ background: ga.is_overdue ? "#fef2f2" : "transparent" }}>
                        <td>{ga.action_id}</td>
                        <td>{ga.action_type}</td>
                        <td>{ga.owner_role}</td>
                        <td>{ga.employee_code}</td>
                        <td><span style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          background: ga.priority === "HIGH" ? "#fee2e2" : "#fef3c7",
                          fontSize: "11px",
                          fontWeight: 800
                        }}>{ga.priority}</span></td>
                        <td>
                          {ga.due_at}
                          {ga.is_overdue === 1 && <span style={{ color: "#dc2626", marginLeft: "8px" }}>⚠ OVERDUE</span>}
                        </td>
                        <td>{ga.status}</td>
                        <td>
                          {ga.status !== "CLOSED" && (
                            <button onClick={() => updateGovernanceStatus(ga.action_id, "CLOSED")} style={{ padding: "6px 10px", fontSize: "12px" }}>
                              Mark Closed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === "LMS Sync" && (
          <section className="card">
            <h3>LMS Sync Status</h3>
            <p style={{ padding: "12px", background: "#dbeafe", borderRadius: "8px", color: "#1e40af", marginBottom: "16px" }}>
              LMS integration placeholder. Coaching and governance status.
            </p>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Trigger</th>
                    <th>Employee</th>
                    <th>Topic</th>
                    <th>Coaching</th>
                    <th>Governance</th>
                    <th>LMS Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coachingTriggers.map((ct) => {
                    const govAction = governanceActions.find(ga => ga.trigger_id === ct.trigger_id);
                    const lmsStatus = ct.status === "COMPLETED" && govAction?.status === "CLOSED" ? "Completed" : "Pending";
                    return (
                      <tr key={ct.trigger_id}>
                        <td>{ct.trigger_id}</td>
                        <td>{ct.employee_code}</td>
                        <td>{ct.coaching_topic}</td>
                        <td>{ct.status}</td>
                        <td>{govAction?.status || "N/A"}</td>
                        <td>{lmsStatus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === "Data Diagnostics" && (
          <>
            <section className="card">
              <h3>Process Data Availability</h3>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Process Code</th>
                      <th>Process Name</th>
                      <th>Type</th>
                      <th>Canonical Calls</th>
                      <th>Raw Outbound</th>
                      <th>Raw Inbound</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableData.map((p) => (
                      <tr key={p.process_code}>
                        <td>{p.process_code}</td>
                        <td>{p.process_name}</td>
                        <td>{p.process_type}</td>
                        <td>{p.canonical_calls}</td>
                        <td>{p.raw_outbound_rows}</td>
                        <td>{p.raw_inbound_rows}</td>
                        <td>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: getStatusColor(p.data_status),
                            color: getStatusTextColor(p.data_status),
                            fontSize: "11px",
                            fontWeight: 800
                          }}>
                            {p.data_status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => viewProcessDiagnostics(p.process_code)} style={{ padding: "6px 10px", fontSize: "12px" }}>
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {processDiagnostics && (
              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3>Process Diagnostics: {processDiagnostics.process_code}</h3>
                  <button onClick={() => setProcessDiagnostics(null)} style={{ padding: "6px 10px", fontSize: "12px" }}>Close</button>
                </div>
                <div className="grid two">
                  <div>
                    <h4>Process Info</h4>
                    <table>
                      <tbody>
                        <tr><td>Process ID</td><td>{processDiagnostics.process_id}</td></tr>
                        <tr><td>Process Code</td><td>{processDiagnostics.process_code}</td></tr>
                        <tr><td>Process Type</td><td>{processDiagnostics.process_type}</td></tr>
                        <tr><td>Client ID</td><td>{processDiagnostics.client_id || "N/A"}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h4>Data Counts</h4>
                    <table>
                      <tbody>
                        <tr><td>Canonical Calls</td><td>{processDiagnostics.call_count}</td></tr>
                        <tr><td>Raw Outbound Rows</td><td>{processDiagnostics.raw_outbound_rows}</td></tr>
                        <tr><td>Raw Inbound Rows</td><td>{processDiagnostics.raw_inbound_rows}</td></tr>
                        <tr><td>Transcripts Available</td><td>{processDiagnostics.transcript_count}</td></tr>
                        <tr><td>Coaching Triggers</td><td>{processDiagnostics.coaching_count}</td></tr>
                        <tr><td>Governance Actions</td><td>{processDiagnostics.governance_count}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {inboundValidation && inboundValidation.validation && (
              <section className="card">
                <h3>Inbound Validation Test</h3>
                <table>
                  <tbody>
                    <tr><td>Test Process Code</td><td>{inboundValidation.validation.process_code}</td></tr>
                    <tr><td>Raw Inbound Count</td><td>{inboundValidation.validation.raw_inbound_count}</td></tr>
                    <tr><td>Canonical Count</td><td>{inboundValidation.validation.canonical_count}</td></tr>
                    <tr><td>Mapping Status</td><td>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: inboundValidation.validation.status === "MAPPED" ? "#d1fae5" : "#fef3c7",
                        color: inboundValidation.validation.status === "MAPPED" ? "#065f46" : "#92400e",
                        fontSize: "11px",
                        fontWeight: 800
                      }}>
                        {inboundValidation.validation.status}
                      </span>
                    </td></tr>
                    <tr><td>Test Endpoint</td><td><code>{inboundValidation.validation.endpoint}</code></td></tr>
                  </tbody>
                </table>
              </section>
            )}

            {inboundValidation && inboundValidation.message && (
              <section className="card">
                <h3>Inbound Validation</h3>
                <p style={{ padding: "12px", background: "#fef3c7", borderRadius: "8px", color: "#92400e" }}>
                  {inboundValidation.message}
                </p>
              </section>
            )}
          </>
        )}

        {page === "Deployment Checklist" && deploymentChecklist && (
          <>
            <section className="card">
              <h3>System Readiness</h3>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deploymentChecklist.checklist.map((item: any, i: number) => (
                      <tr key={i}>
                        <td>{item.item}</td>
                        <td>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: item.status === "✓" ? "#d1fae5" : item.status === "INFO" ? "#dbeafe" : "#fef3c7",
                            color: item.status === "✓" ? "#065f46" : item.status === "INFO" ? "#1e40af" : "#92400e",
                            fontSize: "11px",
                            fontWeight: 800
                          }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h3>Pending Production Items</h3>
              <ul style={{ paddingLeft: "24px", lineHeight: "1.8" }}>
                {deploymentChecklist.pending.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        {audit && (
          <section className="card audit">
            <h3>Call Audit 360 - {audit.call_id}</h3>
            <div style={{ marginBottom: "12px", display: "flex", gap: "8px" }}>
              <button onClick={() => setAudit(null)}>Close</button>
              <button onClick={() => createCoaching(audit)} style={{ background: "#0f766e" }}>Create Coaching</button>
            </div>
            <div className="grid two">
              <div>
                <h4>Call Identity</h4>
                <table>
                  <tbody>
                    <tr><td>Call ID</td><td>{audit.call_id}</td></tr>
                    <tr><td>Source Call ID</td><td>{audit.source_call_id}</td></tr>
                    <tr><td>Process</td><td>{audit.process_name}</td></tr>
                    <tr><td>Agent</td><td>{audit.source_agent_name}</td></tr>
                    <tr><td>Lead</td><td>{audit.lead_id}</td></tr>
                    <tr><td>Date</td><td>{audit.call_datetime}</td></tr>
                    <tr><td>Duration</td><td>{audit.duration_sec}s</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4>AI Audit Status</h4>
                <table>
                  <tbody>
                    <tr><td>Risk</td><td>{audit.risk_level || "NA"}</td></tr>
                    <tr><td>Status</td><td>{audit.processing_status || "NA"}</td></tr>
                    <tr><td>Quality %</td><td>{audit.ai_quality_percent || "NA"}</td></tr>
                    <tr><td>Band</td><td>{audit.quality_band || "NA"}</td></tr>
                    <tr><td>Disposition</td><td>{audit.call_disposition || "NA"}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {audit.outbound_fields && (
              <div style={{ marginTop: "16px" }}>
                <h4>Outbound Sales Fields</h4>
                <table>
                  <tbody>
                    <tr><td>Opening</td><td>{audit.outbound_fields.Opening || "-"}</td></tr>
                    <tr><td>Offered</td><td>{audit.outbound_fields.Offered || "-"}</td></tr>
                    <tr><td>Sale Done</td><td>{audit.outbound_fields.SaleDone || "-"}</td></tr>
                    <tr><td>Product</td><td>{audit.outbound_fields.ProductOffering || "-"}</td></tr>
                    <tr><td>Discount</td><td>{audit.outbound_fields.DiscountType || "-"}</td></tr>
                    <tr><td>Objection Category</td><td>{audit.outbound_fields.CustomerObjectionCategory || "-"}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: "16px" }}>
              <h4>Transcript Preview</h4>
              <pre>{audit.transcript_preview || "No transcript found"}</pre>
            </div>

            {audit.feedback_summary && (
              <div style={{ marginTop: "16px" }}>
                <h4>Feedback Summary</h4>
                <pre>{audit.feedback_summary}</pre>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
