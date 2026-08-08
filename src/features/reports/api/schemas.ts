import { z } from 'zod';

const reportSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['daily', 'monthly', 'yearly']),
  template: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  parameters: z.array(z.string()).nullable().optional().default(null),
  plta_id: z.string().uuid().nullable(),
  ws_id: z.string().uuid().nullable(),
  period_start: z.string(),
  period_end: z.string(),
  file_path: z.string().nullable(),
  error: z.string().nullable(),
  created_at: z.string(),
});

export const apiReportSchema = reportSchema;
export const apiReportPageSchema = z.object({
  items: z.array(reportSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
});

export type ApiReport = z.infer<typeof apiReportSchema>;
export type ApiReportPage = z.infer<typeof apiReportPageSchema>;
