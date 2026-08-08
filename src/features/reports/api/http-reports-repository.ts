import { ApiError, apiRequest, createApiResponseParser } from '../../../api/http';
import type { Report, ReportPage } from '../model';
import {
  apiReportPageSchema,
  apiReportSchema,
  type ApiReport,
  type ApiReportPage,
} from './schemas';
import type { ReportsRepository } from './reports-repository';

const parseResponse = createApiResponseParser(
  'Respons server tidak sesuai kontrak laporan',
);

function mapReport(report: ApiReport): Report {
  return {
    id: report.id,
    type: report.type,
    template: report.template === 'timeseries' || report.template === 'elevation'
      ? report.template
      : 'unsupported',
    status: report.status,
    parameters: report.parameters,
    pltaId: report.plta_id,
    riverBasinId: report.ws_id,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    filePath: report.file_path,
    error: report.error,
    createdAt: report.created_at,
  };
}

function mapPage(page: ApiReportPage): ReportPage {
  return {
    ...page,
    items: page.items.map(mapReport),
  };
}

export const httpReportsRepository: ReportsRepository = {
  async create(input) {
    const endpoint = '/api/v1/reports';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'POST',
      cache: 'no-store',
      json: {
        type: input.type,
        template: input.template,
        plta_id: input.pltaId,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        parameters: input.template === 'timeseries' && input.parameters?.length
          ? input.parameters
          : undefined,
      },
    });
    return mapReport(parseResponse(payload, apiReportSchema, endpoint));
  },

  async list(params, options) {
    const endpoint = '/api/v1/reports';
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
      query: {
        page: params.page,
        limit: params.limit,
        search: params.search,
      },
    });
    return mapPage(parseResponse(payload, apiReportPageSchema, endpoint));
  },

  async get(reportId, options) {
    const endpoint = `/api/v1/reports/${encodeURIComponent(reportId)}`;
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: options?.signal,
    });
    return mapReport(parseResponse(payload, apiReportSchema, endpoint));
  },

  async download(reportId) {
    const endpoint = `/api/v1/reports/${encodeURIComponent(reportId)}/download`;
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    });
    if (!(payload instanceof Blob)) {
      throw new ApiError('File laporan dari server tidak valid', {
        status: 502,
        statusText: 'Invalid API Response',
        url: endpoint,
      });
    }
    return payload;
  },
};
