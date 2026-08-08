export type ReportType = 'daily' | 'monthly' | 'yearly';
export type ReportTemplate = 'timeseries' | 'elevation' | 'unsupported';
export type CreateReportTemplate = Extract<ReportTemplate, 'timeseries' | 'elevation'>;
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CreateReportInput {
  type: ReportType;
  template: CreateReportTemplate;
  pltaId: string;
  periodStart: string;
  periodEnd: string;
  parameters?: string[];
}

export interface Report {
  id: string;
  type: ReportType;
  template: ReportTemplate;
  status: ReportStatus;
  parameters: string[] | null;
  pltaId: string | null;
  riverBasinId: string | null;
  periodStart: string;
  periodEnd: string;
  filePath: string | null;
  error: string | null;
  createdAt: string;
}

export interface ReportListParams {
  page: number;
  limit: number;
  search?: string;
}

export interface ReportPage {
  items: Report[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
