export interface ApiErrorOptions {
  status: number;
  statusText: string;
  code?: string;
  details?: unknown;
  url?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly code?: string;
  readonly details?: unknown;
  readonly url?: string;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.code = options.code;
    this.details = options.details;
    this.url = options.url;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
