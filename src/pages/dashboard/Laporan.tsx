import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Plus,
  Search,
} from 'lucide-react';
import Badge, { type BadgeTone } from '../../components/atoms/Badge';
import Button from '../../components/atoms/Button';
import Select from '../../components/atoms/Select';
import Skeleton from '../../components/atoms/Skeleton';
import ResourceTableSkeleton from '../../components/skeletons/ResourceTableSkeleton';
import Sheet from '../../components/ui/Sheet';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import RefetchBar from '../../components/ui/RefetchBar';
import TablePagination from '../../components/ui/TablePagination';
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

const STATUS_META: Record<ReportStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Menunggu', tone: 'amber' },
  processing: { label: 'Diproses', tone: 'cyan' },
  completed: { label: 'Selesai', tone: 'green' },
  failed: { label: 'Gagal', tone: 'red' },
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

  return (
    <Badge tone={meta.tone} spinning={status === 'processing'}>
      {meta.label}
    </Badge>
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
      <PageHeader
        title="Laporan"
        description={`Laporan time series bulanan PLTA ${plta.shortName}`}
        actions={(
          <>
            <PlantSwitcher page="laporan" />
            <Button
              type="button"
              size="lg"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsQuerySheetOpen(true)}
              className="whitespace-nowrap"
            >
              Buat Laporan
            </Button>
          </>
        )}
      />

      <div className="flex flex-col gap-2.5 border-b border-border-subtle pb-4 sm:flex-row sm:items-center">
        <form onSubmit={applySearch} className="flex min-w-0 items-center gap-2 sm:w-72">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search size={15} className="pointer-events-none absolute left-3 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={100}
              placeholder="Cari nama laporan…"
              className="h-9 w-full min-w-0 rounded-sm border border-border-subtle bg-white pr-3 pl-8.5 text-[12.5px] text-text-primary outline-none transition-[border-color,box-shadow] hover:border-slate-300 focus:border-brand-primary-strong focus:ring-[3px] focus:ring-brand-primary-strong/15 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="h-9 shrink-0 cursor-pointer rounded-sm border border-border-subtle bg-white px-3 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cari
          </button>
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="h-9 shrink-0 cursor-pointer rounded-sm px-2 text-[12.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
            >
              Bersihkan
            </button>
          )}
        </form>
        {!reportsQuery.isError && (
          <span className="shrink-0 text-[11.5px] text-text-muted sm:ml-auto">{total} laporan</span>
        )}
      </div>

      <section className="flex flex-col overflow-hidden rounded-md border border-border-subtle bg-white">
        <RefetchBar isRefetching={reportsQuery.isFetching && !reportsQuery.isLoading} />

        {reportsQuery.isError ? (
          <ErrorState
            title="Daftar laporan belum bisa dimuat"
            description={errorMessage(reportsQuery.error)}
            isRetrying={reportsQuery.isFetching}
            onRetry={() => void reportsQuery.refetch()}
            className="py-10"
          />
        ) : reportsQuery.isLoading ? (
          <div className="overflow-x-auto" role="status" aria-label="Memuat daftar laporan">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="h-9 border-b border-border-subtle bg-surface-overlay">
                  <th className="table-head-cell px-4 text-left">Laporan</th>
                  <th className="table-head-cell px-4 text-left">Periode</th>
                  <th className="table-head-cell px-4 text-left">Dibuat</th>
                  <th className="table-head-cell px-4 text-left">Status</th>
                  <th className="table-head-cell px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody><ResourceTableSkeleton columns={5} rows={PAGE_LIMIT} /></tbody>
            </table>
            <span className="sr-only">Memuat daftar laporan...</span>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet size={19} />}
            title={search ? 'Laporan tidak ditemukan' : 'Belum ada laporan'}
            description={search
              ? 'Coba kata kunci lain atau kosongkan pencarian.'
              : 'Laporan yang Anda buat akan muncul di daftar ini.'}
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="h-9 border-b border-border-subtle bg-surface-overlay">
                  <th className="table-head-cell px-4 text-left">Laporan</th>
                  <th className="table-head-cell px-4 text-left">Periode</th>
                  <th className="table-head-cell px-4 text-left">Dibuat</th>
                  <th className="table-head-cell px-4 text-left">Status</th>
                  <th className="table-head-cell px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-overlay">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5">
                      <p className="text-[12.5px] font-medium text-text-primary">
                        {report.template === 'timeseries' ? 'Laporan Time Series' : 'Laporan Historis'}
                      </p>
                      <p className="mt-0.5 max-w-md truncate text-[11px] text-text-muted">
                        {REPORT_TYPES[report.type]} · {report.parameters?.map(formatParameterLabel).join(', ') || 'semua parameter'}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-text-secondary">{formatDate(report.periodStart)} – {formatDate(report.periodEnd)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-text-secondary">{formatDateTime(report.createdAt)}</td>
                    <td className="px-4 py-2.5"><ReportStatusBadge status={report.status} /></td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        disabled={report.status !== 'completed' || downloadMutation.isPending}
                        onClick={() => void downloadReport(report)}
                        className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-sm border border-border-subtle bg-white px-2.5 text-[11.5px] font-semibold text-brand-primary-strong transition-colors hover:border-brand-tint-border hover:bg-brand-tint disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-base disabled:text-slate-400"
                      >
                        <Download size={14} />
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
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_LIMIT}
            itemLabel="laporan"
            isBusy={reportsQuery.isFetching}
            onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
            onNext={() => setPage((current) => Math.min(current + 1, totalPages))}
          />
        )}
      </section>

      <Sheet
        isOpen={isQuerySheetOpen}
        title="Buat Laporan Bulanan"
        description={`Laporan hidrologi · PLTA ${plta.shortName}`}
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
          <div className="grid gap-2.5 sm:grid-cols-2">
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
            <legend className="field-label">
              Parameter <span className="font-normal text-text-placeholder">· kosongkan berarti semua</span>
            </legend>
            <p className="mb-1 text-[11.5px] leading-[1.6] text-text-muted">Pilihan berasal dari tag aktif PLTA.</p>
            {tagsQuery.isLoading || tagsQuery.isPlaceholderData ? (
              <div className="space-y-2" role="status" aria-label="Memuat parameter tag">
                {Array.from({ length: 4 }, (_, index) => <Skeleton key={`tag-option-${index}`} className="h-12 rounded-md" />)}
              </div>
            ) : tagsQuery.isError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[11.5px] text-red-700">Parameter tag belum dapat dimuat.</p>
            ) : parameterOptions.length === 0 ? (
              <p className="rounded-md border border-border-subtle bg-surface-base px-3 py-2.5 text-[11.5px] text-text-muted">Belum ada tag aktif pada PLTA ini.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto border-t border-border-subtle pr-1">
                {parameterOptions.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-2.5 border-b border-surface-overlay py-2 last:border-b-0">
                    <input
                      type="checkbox"
                      checked={parameters.includes(option.value)}
                      onChange={() => toggleParameter(option.value)}
                      className="size-4 shrink-0 accent-cyan-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] text-text-secondary">{option.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-text-placeholder">
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
