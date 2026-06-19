// backend/src/validators/executive.validators.ts
import { z } from 'zod';

export const summaryQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  processCode: z.string().optional(),
  branchCode: z.string().optional(),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
