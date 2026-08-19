/**
 * Titik kumpul tunggal untuk kegagalan yang tidak terlihat operator: error
 * boundary, respons server 5xx, dan pesan realtime yang gagal kontrak.
 *
 * Modul ini sengaja tidak terikat vendor. Adapter dipasang sekali di composition
 * root lewat `setErrorReporter`; selama belum dipasang, laporan dibuang diam-diam
 * agar aplikasi tetap berjalan normal di lingkungan tanpa error tracking.
 */

export type ErrorSeverity = 'error' | 'fatal';

export interface ErrorReportContext {
  /** Asal kejadian, mis. 'api', 'realtime', 'render'. */
  scope: string;
  severity?: ErrorSeverity;
  [key: string]: unknown;
}

export interface ErrorReport {
  scope: string;
  severity: ErrorSeverity;
  message: string;
  error: unknown;
  context: Record<string, unknown>;
  occurredAt: Date;
}

type ErrorReporter = (report: ErrorReport) => void;

/** Reconnect realtime bisa gagal berulang; jangan banjiri tujuan pelaporan. */
const THROTTLE_WINDOW_MS = 30_000;

let reporter: ErrorReporter | null = null;
const lastReportedAt = new Map<string, number>();

/** Buang query param sensitif; URL WebSocket monitoring membawa access token. */
function redactUrl(value: string): string {
  try {
    const url = new URL(value, 'http://placeholder.invalid');
    for (const key of ['token', 'access_token', 'refresh_token', 'password']) {
      if (url.searchParams.has(key)) url.searchParams.set(key, 'REDACTED');
    }
    return value.startsWith('/') ? `${url.pathname}${url.search}` : url.toString();
  } catch {
    return value;
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Kesalahan tanpa pesan';
}

function shouldThrottle(key: string, now: number): boolean {
  const previous = lastReportedAt.get(key);
  if (previous !== undefined && now - previous < THROTTLE_WINDOW_MS) return true;

  lastReportedAt.set(key, now);
  return false;
}

export function setErrorReporter(next: ErrorReporter | null): void {
  reporter = next;
}

export function reportError(error: unknown, context: ErrorReportContext): void {
  const { scope, severity = 'error', ...rest } = context;
  const message = describeError(error);
  const now = Date.now();

  if (shouldThrottle(`${scope} ${message}`, now)) return;

  const sanitizedContext: Record<string, unknown> = { ...rest };
  if (typeof sanitizedContext.url === 'string') {
    sanitizedContext.url = redactUrl(sanitizedContext.url);
  }

  try {
    reporter?.({
      scope,
      severity,
      message,
      error,
      context: sanitizedContext,
      occurredAt: new Date(now),
    });
  } catch {
    // Pelaporan error tidak boleh menjadi sumber error baru.
  }
}

/** Hanya untuk test: mengosongkan jendela throttle antar kasus uji. */
export function resetErrorReportThrottle(): void {
  lastReportedAt.clear();
}
