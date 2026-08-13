import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Select from '../../components/atoms/Select';
import Skeleton from '../../components/atoms/Skeleton';
import ResourceTableSkeleton from '../../components/skeletons/ResourceTableSkeleton';
import Sheet from '../../components/ui/Sheet';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import {
  useActivePLTA,
  usePLTATagsQuery,
} from '../../features/plta/api/queries';
import {
  useCreateReportMutation,
  useDownloadReportMutation,
  useReportsQuery,
  type Report,
  type ReportStatus,
  type ReportType,
} from '../../features/reports';
import { useNotificationStore } from '../../store/notification-store';

const PAGE_LIMIT = 10;
const MONTH_OPTIONS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
].map((label, index) => ({ value: index + 1, label }));

const REPORT_TYPES: Record<ReportType, string> = {
  daily: 'Harian',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
};

const STATUS_META: Record<ReportStatus, { label: string; className: string }> = {
  pending: { label: 'Menunggu', className: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  processing: { label: 'Diproses', className: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15' },
  completed: { label: 'Selesai', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
  failed: { label: 'Gagal', className: 'bg-red-50 text-red-700 ring-red-600/15' },
};

function getCurrentPeriod(): { month: number; year: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).formatToParts(new Date());

  return {
    month: Number(parts.find((part) => part.type === 'month')?.value ?? 1),
    year: Number(parts.find((part) => part.type === 'year')?.value ?? new Date().getFullYear()),
  };
}

function monthBoundaries(year: number, month: number): { start: string; end: string } {
  const paddedMonth = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${year}-${paddedMonth}-01`,
    end: `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

function dateBoundary(date: string, endOfDay = false): string {
  return new Date(`${date}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+07:00`).toISOString();
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

function formatParameterLabel(parameter: string): string {
  return parameter
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toLocaleUpperCase('id-ID'));
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Permintaan laporan gagal diproses.';
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const meta = STATUS_META[status];
  const icon = status === 'completed'
    ? <CheckCircle2 size={14} />
    : status === 'failed'
      ? <XCircle size={14} />
      : <LoaderCircle size={14} className={status === 'processing' ? 'animate-spin' : ''} />;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.className}`}>
      {icon}
      {meta.label}
    </span>
  );
}

export default function Reports() {
  const { addToast } = useNotificationStore();
  const { plta, pltaId } = useActivePLTA();
  const currentPeriod = useMemo(() => getCurrentPeriod(), []);
  const [month, setMonth] = useState(currentPeriod.month);
  const [year, setYear] = useState(currentPeriod.year);
  const [parametersByPLTA, setParametersByPLTA] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isQuerySheetOpen, setIsQuerySheetOpen] = useState(false);
  const closeQuerySheet = useCallback(() => setIsQuerySheetOpen(false), []);

  const reportsQuery = useReportsQuery({
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
  });
  const tagsQuery = usePLTATagsQuery(pltaId, {
    page: 1,
    limit: 200,
    enabled: true,
  });
  const createMutation = useCreateReportMutation();
  const downloadMutation = useDownloadReportMutation();

  const parameterOptions = useMemo(() => {
    if (tagsQuery.isPlaceholderData) return [];

    const options = new Map<string, { value: string; label: string; units: Set<string>; stations: Set<string> }>();
    for (const tag of tagsQuery.data?.items ?? []) {
      const value = tag.parameter.trim();
      if (!value) continue;
      const existing = options.get(value) ?? {
        value,
        label: formatParameterLabel(value),
        units: new Set<string>(),
        stations: new Set<string>(),
      };
      if (tag.unit.trim()) existing.units.add(tag.unit.trim());
      if (tag.station.trim()) existing.stations.add(tag.station.trim());
      options.set(value, existing);
    }

    return [...options.values()].sort((left, right) => left.label.localeCompare(right.label, 'id-ID'));
  }, [tagsQuery.data?.items, tagsQuery.isPlaceholderData]);

  const yearOptions = useMemo(() => Array.from(
    { length: currentPeriod.year - 1998 },
    (_, index) => currentPeriod.year + 1 - index,
  ).map((value) => ({ value, label: String(value) })), [currentPeriod.year]);

  const reports = reportsQuery.data?.items ?? [];
  const parameters = parametersByPLTA[pltaId] ?? [];
  const total = reportsQuery.data?.total ?? 0;
  const totalPages = Math.max(reportsQuery.data?.pages ?? 1, 1);
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const lastItem = Math.min(page * PAGE_LIMIT, total);

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const toggleParameter = (parameter: string) => {
    setParametersByPLTA((current) => {
      const selected = current[pltaId] ?? [];
      return {
        ...current,
        [pltaId]: selected.includes(parameter)
          ? selected.filter((item) => item !== parameter)
          : [...selected, parameter],
      };
    });
  };

  const createReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const period = monthBoundaries(year, month);

    try {
      await createMutation.mutateAsync({
        type: 'monthly',
        template: 'timeseries',
        pltaId,
        periodStart: dateBoundary(period.start),
        periodEnd: dateBoundary(period.end, true),
        parameters: parameters.length > 0 ? parameters : undefined,
      });
      setPage(1);
      setIsQuerySheetOpen(false);
      addToast({ type: 'success', message: 'Laporan time series bulanan masuk antrean backend.' });
    } catch (error) {
      addToast({ type: 'error', message: errorMessage(error) });
    }
  };

  const downloadReport = async (report: Report) => {
    try {
      const blob = await downloadMutation.mutateAsync(report.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `laporan-timeseries-${report.periodStart.slice(0, 7)}.xlsx`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      addToast({ type: 'success', message: 'File laporan Excel berhasil diunduh.' });
    } catch (error) {
      addToast({ type: 'error', message: errorMessage(error) });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="page-title">Laporan</h1>
          <p className="page-description">Laporan time series bulanan PLTA {plta.shortName}</p>
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
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Daftar Laporan</h2>
            <p className="mt-1 text-xs text-slate-500">Status laporan diperbarui otomatis hingga file siap diunduh.</p>
          </div>
          <form onSubmit={applySearch} className="flex w-full items-center gap-2 xl:max-w-md">
            <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-600/10">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                maxLength={100}
                placeholder="Cari jenis atau status..."
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              {search && (
                <button type="button" onClick={clearSearch} className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600">
                  Bersihkan
                </button>
              )}
            </div>
            <button type="submit" className="h-10 shrink-0 cursor-pointer rounded-lg bg-slate-100 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-200">
              Cari
            </button>
          </form>
        </div>

        <div className="h-0.5 bg-transparent">
          {reportsQuery.isFetching && !reportsQuery.isLoading && <Skeleton className="h-full w-full" />}
        </div>

        {reportsQuery.isError ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">{errorMessage(reportsQuery.error)}</div>
        ) : reportsQuery.isLoading ? (
          <div className="overflow-x-auto" role="status" aria-label="Memuat daftar laporan">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.06em] text-slate-500">
                <tr><th className="px-6 py-3.5 font-semibold">Laporan</th><th className="px-4 py-3.5 font-semibold">Periode</th><th className="px-4 py-3.5 font-semibold">Dibuat</th><th className="px-4 py-3.5 font-semibold">Status</th><th className="px-6 py-3.5 text-right font-semibold">Aksi</th></tr>
              </thead>
              <tbody><ResourceTableSkeleton columns={5} rows={PAGE_LIMIT} /></tbody>
            </table>
            <span className="sr-only">Memuat daftar laporan...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><FileSpreadsheet size={20} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-600">{search ? 'Laporan tidak ditemukan' : 'Belum ada laporan'}</p>
              <p className="mt-1 text-xs text-slate-400">{search ? 'Coba gunakan kata pencarian lain.' : 'Laporan time series bulanan akan muncul di sini.'}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.06em] text-slate-500">
                <tr><th className="px-6 py-3.5 font-semibold">Laporan</th><th className="px-4 py-3.5 font-semibold">Periode</th><th className="px-4 py-3.5 font-semibold">Dibuat</th><th className="px-4 py-3.5 font-semibold">Status</th><th className="px-6 py-3.5 text-right font-semibold">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700">
                        {report.template === 'timeseries' ? 'Laporan Time Series' : 'Laporan Historis'}
                      </p>
                      <p className="mt-1 max-w-md truncate text-xs text-slate-400">
                        {REPORT_TYPES[report.type]} · {report.parameters?.map(formatParameterLabel).join(', ') || 'semua parameter'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(report.periodStart)} – {formatDate(report.periodEnd)}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatDateTime(report.createdAt)}</td>
                    <td className="px-4 py-4"><ReportStatusBadge status={report.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={report.status !== 'completed' || downloadMutation.isPending}
                        onClick={() => void downloadReport(report)}
                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#0891b2] bg-white px-3 text-xs font-semibold text-[#0891b2] hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <Download size={15} />
                        Unduh Excel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!reportsQuery.isLoading && !reportsQuery.isError && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-5">
            <p className="text-xs text-slate-400">
              Menampilkan {firstItem}–{lastItem} dari {total} laporan
            </p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={page <= 1 || reportsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="min-w-20 text-center text-xs font-semibold text-slate-600">{page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages || reportsQuery.isFetching}
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      <Sheet
        isOpen={isQuerySheetOpen}
        title="Buat Laporan Bulanan"
        description={`Laporan time series PLTA ${plta.shortName}.`}
        onClose={closeQuerySheet}
        footer={(
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeQuerySheet} className="w-full sm:w-auto">Batal</Button>
            <Button
              type="submit"
              form="report-query-form"
              leftIcon={createMutation.isPending ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              Buat Laporan
            </Button>
          </div>
        )}
      >
        <form id="report-query-form" onSubmit={(event) => void createReport(event)} className="flex flex-col gap-5">
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 px-4 py-3">
            <p className="text-xs font-medium text-cyan-700">Time Series Bulanan</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">PLTA {plta.shortName}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Bulan"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              options={MONTH_OPTIONS}
            />
            <Select
              label="Tahun"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              options={yearOptions}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-700">Parameter</legend>
            <p className="mb-1 text-xs leading-5 text-slate-400">Pilihan berasal dari tag aktif PLTA. Kosongkan untuk menyertakan semua parameter.</p>
            {tagsQuery.isLoading || tagsQuery.isPlaceholderData ? (
              <div className="space-y-2" role="status" aria-label="Memuat parameter tag">
                {Array.from({ length: 4 }, (_, index) => <Skeleton key={`tag-option-${index}`} className="h-12 rounded-lg" />)}
              </div>
            ) : tagsQuery.isError ? (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-xs text-red-600">Parameter tag belum dapat dimuat.</p>
            ) : parameterOptions.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">Belum ada tag aktif pada PLTA ini.</p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {parameterOptions.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 hover:border-cyan-300 hover:bg-cyan-50/30">
                    <input
                      type="checkbox"
                      checked={parameters.includes(option.value)}
                      onChange={() => toggleParameter(option.value)}
                      className="size-4 shrink-0 accent-cyan-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-slate-700">{option.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                        {option.stations.size > 0 ? `${option.stations.size} stasiun` : 'Tag aktif'}
                        {option.units.size > 0 ? ` · ${[...option.units].join(', ')}` : ''}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </form>
      </Sheet>
    </div>
  );
}
