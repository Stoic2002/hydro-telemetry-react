import { useCallback, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Plus,
  XCircle,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Select from '../../components/atoms/Select';
import Sheet from '../../components/ui/Sheet';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import { useActivePLTA } from '../../features/plta/api/queries';
import { useNotificationStore } from '../../store/notification-store';

type ReportTemplate = 'timeseries' | 'roh' | 'elevation' | 'rtow';
type ReportType = 'daily' | 'monthly' | 'yearly';
type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface LocalReport {
  id: string;
  template: ReportTemplate;
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  createdAt: Date;
}

const REPORT_TEMPLATES: Record<ReportTemplate, string> = {
  timeseries: 'Laporan Time Series',
  roh: 'Rencana Operasi Harian (ROH)',
  elevation: 'Kurva Elevasi',
  rtow: 'Rencana Tahunan Operasi Waduk (RTOW)',
};

const REPORT_TYPES: Record<ReportType, string> = {
  daily: 'Harian',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
};

const STATUS_META: Record<ReportStatus, { label: string; className: string }> = {
  pending: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  },
  processing: {
    label: 'Diproses',
    className: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  },
  failed: {
    label: 'Gagal',
    className: 'bg-red-50 text-red-700 ring-red-600/15',
  },
};

function getTodayInputValue(): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function createLocalReportId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `local-report-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const statusMeta = STATUS_META[status];
  const icon = status === 'completed'
    ? <CheckCircle2 size={14} />
    : status === 'failed'
      ? <XCircle size={14} />
      : <LoaderCircle size={14} className={status === 'processing' ? 'animate-spin' : ''} />;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.className}`}>
      {icon}
      {statusMeta.label}
    </span>
  );
}

export default function Reports() {
  const { addToast } = useNotificationStore();
  const { plta } = useActivePLTA();
  const today = getTodayInputValue();
  const [template, setTemplate] = useState<ReportTemplate>('timeseries');
  const [type, setType] = useState<ReportType>('monthly');
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [reports, setReports] = useState<LocalReport[]>([]);
  const [isQuerySheetOpen, setIsQuerySheetOpen] = useState(false);
  const closeQuerySheet = useCallback(() => setIsQuerySheetOpen(false), []);

  const updateReportStatus = (reportId: string, status: ReportStatus) => {
    setReports((currentReports) => currentReports.map((report) => (
      report.id === reportId ? { ...report, status } : report
    )));
  };

  const createReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (periodStart > periodEnd) {
      addToast({ type: 'error', message: 'Tanggal mulai tidak boleh melewati tanggal akhir' });
      return;
    }

    const reportId = createLocalReportId();
    const report: LocalReport = {
      id: reportId,
      template,
      type,
      periodStart,
      periodEnd,
      status: 'pending',
      createdAt: new Date(),
    };

    setReports((currentReports) => [report, ...currentReports]);
    setIsQuerySheetOpen(false);
    addToast({ type: 'success', message: 'Permintaan laporan ditambahkan ke daftar' });

    window.setTimeout(() => updateReportStatus(reportId, 'processing'), 500);
    window.setTimeout(() => updateReportStatus(reportId, 'completed'), 1600);
  };

  const downloadReport = (report: LocalReport) => {
    const csv = [
      'Laporan,PLTA,Jenis,Periode Mulai,Periode Akhir,Status,Dibuat Pada',
      [
        REPORT_TEMPLATES[report.template],
        plta.name,
        REPORT_TYPES[report.type],
        report.periodStart,
        report.periodEnd,
        'completed',
        report.createdAt.toISOString(),
      ].map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `laporan-${report.template}-${report.periodStart}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: 'File laporan berhasil diunduh' });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">Laporan</h1>
          <p className="page-description">Buat laporan untuk PLTA {plta.name}, lalu pantau status dan unduh hasilnya dari daftar.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PlantSwitcher page="laporan" />
          <Button
            type="button"
            leftIcon={<Plus size={17} />}
            onClick={() => setIsQuerySheetOpen(true)}
            className="h-11 whitespace-nowrap"
          >
            Buat Laporan
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-slate-800">Daftar Laporan</h2>
            <p className="text-xs text-slate-500">Tombol unduh aktif hanya ketika status laporan sudah completed.</p>
          </div>
          <p className="text-xs font-medium text-slate-500">
            {reports.length} laporan
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><FileSpreadsheet size={20} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Belum ada laporan</p>
              <p className="mt-1 text-xs text-slate-400">Klik “Buat Laporan” untuk menambahkan laporan pertama.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full border-collapse text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.06em] text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Laporan</th>
                  <th className="px-4 py-3.5 font-semibold">Periode</th>
                  <th className="px-4 py-3.5 font-semibold">Dibuat</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700">{REPORT_TEMPLATES[report.template]}</p>
                      <p className="mt-1 text-xs text-slate-400">{REPORT_TYPES[report.type]} · PLTA {plta.shortName}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(report.periodStart)} – {formatDate(report.periodEnd)}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatDateTime(report.createdAt)}</td>
                    <td className="px-4 py-4"><ReportStatusBadge status={report.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={report.status !== 'completed'}
                        onClick={() => downloadReport(report)}
                        title={report.status === 'completed' ? 'Unduh laporan' : 'Laporan belum selesai diproses'}
                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#0891b2] bg-white px-3 text-xs font-semibold text-[#0891b2] transition-colors hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <Download size={15} />
                        Unduh
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Sheet
        isOpen={isQuerySheetOpen}
        title="Buat Laporan"
        description={`Tentukan jenis dan periode laporan untuk PLTA ${plta.name}.`}
        onClose={closeQuerySheet}
        footer={(
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={closeQuerySheet}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="report-query-form"
              leftIcon={<Plus size={17} />}
              className="w-full sm:w-auto"
            >
              Tambahkan ke Daftar
            </Button>
          </div>
        )}
      >
        <form id="report-query-form" onSubmit={createReport} className="flex flex-col gap-5">
          <div className="rounded-xl bg-cyan-50/70 px-4 py-3 ring-1 ring-cyan-100">
            <p className="text-xs font-medium text-cyan-700">Target laporan</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">PLTA {plta.shortName}</p>
          </div>

          <Select
            label="Jenis Laporan"
            value={template}
            onChange={(event) => setTemplate(event.target.value as ReportTemplate)}
            options={Object.entries(REPORT_TEMPLATES).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Rentang Laporan"
            value={type}
            onChange={(event) => setType(event.target.value as ReportType)}
            options={Object.entries(REPORT_TYPES).map(([value, label]) => ({ value, label }))}
          />
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Tanggal Mulai
            <span className="relative">
              <CalendarDays size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={periodStart}
                max={periodEnd}
                onChange={(event) => setPeriodStart(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-sm text-slate-700 outline-none transition-colors focus:border-[#0891b2] focus:ring-2 focus:ring-[#0891b2]/15"
              />
            </span>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Tanggal Akhir
            <span className="relative">
              <CalendarDays size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={periodEnd}
                min={periodStart}
                onChange={(event) => setPeriodEnd(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-sm text-slate-700 outline-none transition-colors focus:border-[#0891b2] focus:ring-2 focus:ring-[#0891b2]/15"
              />
            </span>
          </label>
        </form>
      </Sheet>
    </div>
  );
}
