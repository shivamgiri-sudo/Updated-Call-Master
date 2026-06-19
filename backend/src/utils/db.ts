import { DB, pool, qid } from "../config/db";

/**
 * Resolves the client_id for a given processCode via the canonical call master join.
 * Used by outbound, funnels, inbound, and export modules.
 */
export async function getClientIdFromProcess(processCode: string): Promise<number | null> {
  const sql = `
    SELECT DISTINCT cm.client_id
    FROM ${qid(DB.APP)}.ci_call_master cm
    JOIN ${qid(DB.APP)}.ci_process_master pm
      ON cm.process_id = pm.process_id
    WHERE pm.process_code = ?
      AND cm.client_id IS NOT NULL
    LIMIT 1
  `;
  const [rows]: any = await pool.query(sql, [processCode]);
  return rows?.[0]?.client_id ?? null;
}

/**
 * Tries a live DB query first; falls back to demo data on error.
 * Logs the error to stderr so failures are visible — never silently swallowed.
 */
export async function readOrFallback<T>(
  sql: string,
  fallback: T,
  mapRows: (rows: any[]) => T,
  params: any[] = []
): Promise<{ source: string; data: T; warning?: string }> {
  try {
    const [rows]: any = await pool.query(sql, params);
    return { source: "mysql_app_owned", data: mapRows(rows || []) };
  } catch (error: any) {
    console.error("[DB fallback triggered]", error.message);
    return { source: "demo_fallback", warning: error.message, data: fallback };
  }
}
