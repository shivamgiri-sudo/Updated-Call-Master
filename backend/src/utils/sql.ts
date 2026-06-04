export function yesNoFlag(columnSql: string): string {
  return `
    CASE
      WHEN LOWER(TRIM(${columnSql})) IN ('yes','y','1','true','done','pass','sale done') THEN 1
      WHEN LOWER(TRIM(${columnSql})) IN ('no','n','0','false','fail') THEN 0
      ELSE NULL
    END
  `;
}

export function limitSafe(input: unknown, fallback = 50, max = 200): number {
  const n = Number(input || fallback);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}
