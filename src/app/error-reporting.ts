import { env } from '../shared/lib/env';
import { setErrorReporter, type ErrorReport } from '../shared/lib/report-error';

/**
 * Adapter pelaporan error untuk deployment jaringan lokal. Aplikasi ini tidak
 * dipublikasikan ke internet, jadi error tracking berbasis SaaS tidak relevan:
 *
 * 1. Riwayat terakhir disimpan di memori supaya bisa diambil saat operator
 *    melapor, tanpa perlu layanan eksternal.
 * 2. Bila `VITE_ERROR_REPORT_URL` diisi, laporan dikirim ke endpoint di jaringan
 *    yang sama. Tanpa nilai itu, tidak ada request keluar sama sekali.
 */

const MAX_BUFFERED_REPORTS = 20;

interface StoredReport {
  scope: string;
  severity: string;
  message: string;
  occurredAt: string;
  context: Record<string, unknown>;
}

const recentReports: StoredReport[] = [];

/** Riwayat error sesi berjalan, untuk keperluan diagnosis. */
export function getRecentErrorReports(): readonly StoredReport[] {
  return recentReports;
}

function toStoredReport(report: ErrorReport): StoredReport {
  return {
    scope: report.scope,
    severity: report.severity,
    message: report.message,
    occurredAt: report.occurredAt.toISOString(),
    context: report.context,
  };
}

function sendToLocalCollector(endpoint: string, stored: StoredReport): void {
  try {
    void fetch(endpoint, {
      method: 'POST',
      keepalive: true,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...stored,
        userAgent: navigator.userAgent,
        path: window.location.pathname,
      }),
    }).catch(() => {
      // Kolektor tidak terjangkau bukan alasan untuk mengganggu operator.
    });
  } catch {
    // Abaikan.
  }
}

export function installErrorReporting(): void {
  const collectorUrl = env.errorReportUrl;

  setErrorReporter((report) => {
    const stored = toStoredReport(report);

    recentReports.push(stored);
    if (recentReports.length > MAX_BUFFERED_REPORTS) recentReports.shift();

    if (import.meta.env.DEV) {
      console.error(`[${stored.scope}] ${stored.message}`, report.error, stored.context);
    }

    if (collectorUrl) sendToLocalCollector(collectorUrl, stored);
  });
}
