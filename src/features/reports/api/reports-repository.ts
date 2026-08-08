import type {
  CreateReportInput,
  Report,
  ReportListParams,
  ReportPage,
} from '../model';

export interface ReportRequestOptions {
  signal?: AbortSignal;
}

export interface ReportsRepository {
  create(input: CreateReportInput): Promise<Report>;
  list(params: ReportListParams, options?: ReportRequestOptions): Promise<ReportPage>;
  get(reportId: string, options?: ReportRequestOptions): Promise<Report>;
  download(reportId: string): Promise<Blob>;
}
