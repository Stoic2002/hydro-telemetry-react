import { ApiError } from './api-error';
import { getAccessToken, refreshAuthSession } from './auth-session';
import { buildApiUrl, type QueryValue } from './url';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null;
  json?: unknown;
  query?: Record<string, QueryValue>;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return undefined;

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  const text = await response.text();
  return text || undefined;
}

function getPayloadField(payload: unknown, field: string): unknown {
  if (typeof payload !== 'object' || payload === null) return undefined;
  return Reflect.get(payload, field);
}

function getErrorMessage(payload: unknown, response: Response): string {
  const message = getPayloadField(payload, 'message');
  if (typeof message === 'string' && message.trim()) return message;

  const detail = getPayloadField(payload, 'detail');
  if (typeof detail === 'string' && detail.trim()) return detail;

  if (typeof payload === 'string' && payload.trim()) return payload;

  if (response.status === 401) return 'Sesi tidak valid atau telah berakhir';
  if (response.status === 403) return 'Anda tidak memiliki akses untuk aksi ini';

  return response.statusText || 'Permintaan ke server gagal';
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const {
    body: requestBody,
    headers: initialHeaders,
    json,
    query,
    auth = true,
    retryOnUnauthorized = true,
    ...requestInit
  } = options;

  if (json !== undefined && requestBody !== undefined) {
    throw new TypeError('Gunakan salah satu dari json atau body, bukan keduanya');
  }

  const headers = new Headers(initialHeaders);
  headers.set('Accept', 'application/json');

  if (auth && !headers.has('Authorization')) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  let body = requestBody;

  if (json !== undefined) {
    body = JSON.stringify(json);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const url = buildApiUrl(path, query);
  let response: Response;

  try {
    response = await fetch(url, {
      ...requestInit,
      body,
      credentials: requestInit.credentials ?? 'include',
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError('Tidak dapat terhubung ke server', {
      status: 0,
      statusText: 'Network Error',
      url,
      cause: error,
    });
  }

  if (auth && retryOnUnauthorized && response.status === 401) {
    const refreshedTokens = await refreshAuthSession();

    if (refreshedTokens) {
      headers.set('Authorization', `Bearer ${refreshedTokens.access_token}`);

      try {
        response = await fetch(url, {
          ...requestInit,
          body,
          credentials: requestInit.credentials ?? 'include',
          headers,
        });
      } catch (error) {
        throw new ApiError('Tidak dapat terhubung ke server', {
          status: 0,
          statusText: 'Network Error',
          url,
          cause: error,
        });
      }
    }
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const code = getPayloadField(payload, 'code');
    const details = getPayloadField(payload, 'details')
      ?? getPayloadField(payload, 'errors')
      ?? getPayloadField(payload, 'detail');

    throw new ApiError(getErrorMessage(payload, response), {
      status: response.status,
      statusText: response.statusText,
      code: typeof code === 'string' ? code : undefined,
      details,
      url,
    });
  }

  return payload as TResponse;
}
