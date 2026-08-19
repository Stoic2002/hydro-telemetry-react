import { ImageOff, Upload } from 'lucide-react';
import Skeleton from '../../../components/atoms/Skeleton';
import SourceMarker from '../../../components/atoms/SourceMarker';
import type { MonthlyHydrology } from '../../../features/hydrology';
import {
  MONTHS,
  type MetricRow,
  type MetricSource,
} from './presentation';

const sourceClasses: Record<MetricSource, string> = {
  api: 'text-brand-primary-pressed',
  formula: 'text-violet-700',
  input: 'text-amber-700',
  constant: 'text-text-subtle',
  unavailable: 'text-text-muted',
};

function StatusLabel({ value }: { value: string }) {
  const normalizedValue = value.toLocaleLowerCase('id-ID');

  if (value === '—') {
    return <span className="font-mono text-xs font-medium text-text-muted">—</span>;
  }

  const style = normalizedValue.includes('normal')
    ? 'bg-zone-hilir'
    : normalizedValue.includes('basah')
      ? 'bg-zone-hulu'
      : normalizedValue.includes('kering')
        ? 'bg-zone-dam'
        : 'bg-disabled';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-text-secondary">
      <span className={`size-[7px] rounded-full ${style}`} />
      {value}
    </span>
  );
}

export function MonthlyTable({
  currentMonthIndex,
  records,
  isLoading,
}: {
  currentMonthIndex: number;
  records: MonthlyHydrology[];
  isLoading: boolean;
}) {
  const monthlyEntries = MONTHS.map((month, index) => {
    const record = records.find((item) => item.month === index + 1);

    return {
      month,
      index,
      predictionStatus: isLoading
        ? 'Memuat'
        : record?.hydrologyPrediction || '—',
      actualStatus: isLoading
        ? 'Memuat'
        : record?.hydrologyActual || '—',
    };
  });
  const statusRows = [
    {
      label: 'Prediksi',
      getValue: (entry: (typeof monthlyEntries)[number]) => entry.predictionStatus,
    },
    {
      label: 'Aktual',
      getValue: (entry: (typeof monthlyEntries)[number]) => entry.actualStatus,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-raised">
      <table className="w-full min-w-[1120px] table-fixed border-collapse">
        <thead>
          <tr className="bg-surface-overlay">
            <th
              scope="col"
              className="table-head-cell sticky left-0 z-20 w-[136px] border-r border-border-subtle bg-surface-overlay px-3.5 py-2.5 text-left"
            >
              Status
            </th>
            {monthlyEntries.map(({ month, index }) => {
              const isCurrentMonth = currentMonthIndex === index;

              return (
                <th
                  key={month}
                  scope="col"
                  title={isCurrentMonth ? `${month} · bulan berjalan` : month}
                  className={`table-head-cell px-2 py-2.5 text-center ${
                    isCurrentMonth ? 'bg-brand-tint text-brand-primary-pressed' : ''
                  }`}
                >
                  {month.slice(0, 3)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {statusRows.map((row) => (
            <tr key={row.label} className="border-t border-surface-overlay first:border-border-subtle">
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-border-subtle bg-surface-raised px-3.5 py-2.5 text-left text-xs font-semibold text-text-primary"
              >
                {row.label}
              </th>
              {monthlyEntries.map((entry) => {
                const isCurrentMonth = currentMonthIndex === entry.index;

                return (
                  <td
                    key={entry.month}
                    className={`px-2 py-2.5 text-center ${
                      isCurrentMonth ? 'bg-brand-tint' : 'bg-surface-raised'
                    }`}
                  >
                    <StatusLabel value={row.getValue(entry)} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ForecastMapCard({
  title,
  subtitle,
  imageUrl,
  isLoading,
  isError,
  onUpload,
}: {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  isLoading: boolean;
  isError: boolean;
  onUpload?: () => void;
}) {
  const canUpload = Boolean(onUpload) && !isLoading && !imageUrl;
  const meta = isLoading
    ? 'Memuat…'
    : imageUrl
      ? subtitle
      : isError
        ? 'Gagal dimuat'
        : 'Belum tersedia';

  const content = (
    <>
      <div
        className={`flex h-[190px] items-center justify-center ${canUpload ? 'bg-surface-base' : 'bg-surface-overlay'}`}
      >
        {isLoading ? (
          <Skeleton className="size-full rounded-none" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={title} className="size-full object-contain" />
        ) : canUpload ? (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <Upload size={20} className="text-text-muted" />
            <span className="text-xs font-semibold text-text-secondary">Unggah gambar</span>
            <span className="text-[10.5px] text-text-muted">{subtitle}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <ImageOff size={20} className={isError ? 'text-red-400' : 'text-disabled'} />
            <span className={`text-[10.5px] ${isError ? 'text-status-danger-strong' : 'text-text-muted'}`}>
              {isError ? 'Gambar gagal dimuat' : 'Gambar belum tersedia'}
            </span>
          </div>
        )}
      </div>
      <div
        className={`flex items-center justify-between gap-2 border-t px-3 py-2 ${canUpload ? 'border-dashed border-border-strong' : 'border-border-subtle'}`}
      >
        <span className="truncate text-xs font-medium text-text-primary">{title}</span>
        <span
          className={`shrink-0 text-[10.5px] ${imageUrl ? 'text-text-muted' : 'text-text-muted'}`}
        >
          {meta}
        </span>
      </div>
    </>
  );

  if (canUpload && onUpload) {
    return (
      <button
        type="button"
        onClick={onUpload}
        aria-label={`Unggah ${title}`}
        className="cursor-pointer overflow-hidden rounded-md border border-dashed border-border-strong bg-surface-raised text-left transition-colors hover:border-brand-primary-strong focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/30"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="overflow-hidden rounded-md border border-border-subtle bg-surface-raised">
      {content}
    </article>
  );
}

/**
 * Daftar parameter bulanan: label + penanda sumber di kiri, nilai + satuan di
 * kanan, dipisah garis. Tanpa kartu pembungkus dan tanpa header kolom.
 */
export function ForecastDetail({ rows }: { rows: MetricRow[] }) {
  return (
    <div className="border-t border-border-subtle">
      {rows.map((row) => {
        const isUnavailable = row.sourceType === 'unavailable';

        return (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 border-b border-surface-overlay py-[9px] last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-[7px]">
              <span
                className={`truncate text-[12.5px] ${isUnavailable ? 'text-text-muted' : 'text-text-secondary'}`}
              >
                {row.label}
              </span>
              <span title={row.source} className={`flex shrink-0 ${sourceClasses[row.sourceType]}`}>
                <SourceMarker type={row.sourceType} />
                <span className="sr-only">{row.source}</span>
              </span>
            </span>
            <span
              className={`metric-value shrink-0 text-[13px] ${isUnavailable ? 'text-text-muted' : ''}`}
            >
              {row.value}
              {row.unit && <span className="metric-unit ml-1">{row.unit}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
