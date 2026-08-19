import { ApiError } from './api-error';
import { reportError } from '../../shared/lib/report-error';

interface SafeParseSchema<T> {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: { flatten: () => unknown } };
}

export function createApiResponseParser(message: string) {
  return function parseApiResponse<T>(
    payload: unknown,
    schema: SafeParseSchema<T>,
    endpoint: string,
  ): T {
    const result = schema.safeParse(payload);
    if (result.success) return result.data;

    const contractError = new ApiError(message, {
      status: 502,
      statusText: 'Invalid API Response',
      details: result.error.flatten(),
      url: endpoint,
    });

    // Kontrak backend berubah tanpa pemberitahuan adalah kegagalan yang harus
    // sampai ke tim, bukan hanya ke layar operator.
    reportError(contractError, {
      scope: 'api-contract',
      url: endpoint,
      issues: contractError.details,
    });

    throw contractError;
  };
}
