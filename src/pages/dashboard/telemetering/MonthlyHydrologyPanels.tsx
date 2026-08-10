import { ImageOff, Upload } from 'lucide-react';
import Skeleton from '../../../components/atoms/Skeleton';
import type { MonthlyHydrology } from '../../../features/hydrology/model';
import {
  MONTHS,
  type MetricRow,
  type MetricSource,
} from './presentation';

const sourceClasses: Record<MetricSource, string> = {
  api: 'text-[#0e7490]',
  formula: 'text-[#b45309]',
  input: 'text-[#64748b]',
  unavailable: 'text-[#dc2626]',
  constant: 'text-[#94a3b8]',
};

function StatusLabel({ value }: { value: string }) {
  const normalizedValue = value.toLocaleLowerCase('id-ID');
  const style = normalizedValue.includes('normal')
    ? 'bg-emerald-500'
    : normalizedValue.includes('basah')
      ? 'bg-cyan-500'
      : normalizedValue.includes('kering')
        ? 'bg-amber-500'
        : 'bg-slate-300';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-slate-600">
      <span className={`size-1.5 rounded-full ${style}`} />
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
    <div className="overflow-x-auto border-y border-[#e2e8f0]">
      <table className="w-full min-w-[1120px] table-fixed border-collapse">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th
              scope="col"
              className="sticky left-0 z-20 w-[136px] bg-[#f8fafc] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]"
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
                  className={`border-l border-[#e2e8f0] px-2 py-3 text-center text-xs font-semibold ${
                    isCurrentMonth ? 'bg-cyan-50 text-[#0e7490]' : 'text-[#64748b]'
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
            <tr key={row.label} className="border-t border-[#e2e8f0]">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-semibold text-[#475569]"
              >
                {row.label}
              </th>
              {monthlyEntries.map((entry) => {
                const isCurrentMonth = currentMonthIndex === entry.index;

                return (
                  <td
                    key={entry.month}
                    className={`border-l border-[#e2e8f0] px-2 py-3 text-center ${
                      isCurrentMonth ? 'bg-[#f0fdff]' : 'bg-white'
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
  const content = (
    <>
      <div className="border-b border-[#e2e8f0] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
        <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p>
      </div>
      <div className="flex h-[220px] items-center justify-center bg-[#f8fafc]">
        {isLoading ? (
          <Skeleton className="size-full rounded-none" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="size-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <ImageOff size={24} className={isError ? 'text-red-400' : 'text-slate-300'} />
            <p className={`text-xs font-medium ${isError ? 'text-red-500' : 'text-slate-400'}`}>
              {isError ? 'Gambar gagal dimuat' : 'Gambar belum tersedia'}
            </p>
            {canUpload && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700">
                <Upload size={13} />
                Klik untuk unggah
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-[#e2e8f0] px-4 py-2.5 text-[11px]">
        <span className="text-[#64748b]">Sumber gambar BMKG</span>
        <span className="font-medium text-[#0e7490]">
          {imageUrl ? 'Tersedia' : canUpload ? 'Siap diunggah' : 'Belum tersedia'}
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
        className="overflow-hidden border border-[#e2e8f0] bg-white text-left transition-colors hover:border-cyan-300 hover:bg-cyan-50/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      {content}
    </article>
  );
}

export function ForecastDetail({ rows }: { rows: MetricRow[] }) {
  return (
    <article className="overflow-hidden border border-[#e2e8f0] bg-white">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 bg-[#f8fafc] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">
        <span>Parameter</span>
        <span>Nilai</span>
      </div>
      <div className="divide-y divide-[#f1f5f9] px-4">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium leading-5 text-[#475569]">{row.label}</p>
              <p className={`mt-0.5 text-[11px] font-medium ${sourceClasses[row.sourceType]}`}>
                {row.source}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-[#0f172a]">{row.value}</span>
              {row.unit && <span className="ml-1 text-[10px] text-[#94a3b8]">{row.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
