import { ApiError } from './api-error';

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

    throw new ApiError(message, {
      status: 502,
      statusText: 'Invalid API Response',
      details: result.error.flatten(),
      url: endpoint,
    });
  };
}
