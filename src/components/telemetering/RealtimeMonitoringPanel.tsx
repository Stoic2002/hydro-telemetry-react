import {
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  useMonitoringStream,
  usePLTALatestQuery,
  type MonitoringConnectionStatus,
  type MonitoringParameter,
  type MonitoringParameterLatest,
} from '../../features/monitoring';

interface RealtimeMonitoringPanelProps {
  pltaId: string;
}

interface ParameterDefinition {
  parameter: MonitoringParameter;
  label: string;
  unit: string | null;
}

const FEATURED_PARAMETERS: ParameterDefinition[] = [
  { parameter: 'reservoir', label: 'Elevasi Waduk', unit: 'mdpl' },
  { parameter: 'water_level', label: 'Tinggi Muka Air', unit: 'm' },
  { parameter: 'volume_efektif', label: 'Volume Efektif', unit: 'juta m³' },
  { parameter: 'inflow', label: 'Inflow', unit: 'm³/s' },
  { parameter: 'total_outflow', label: 'Total Outflow', unit: 'm³/s' },
  { parameter: 'rainfall', label: 'Curah Hujan', unit: 'mm' },
  { parameter: 'beban', label: 'Beban Aktif', unit: 'MW' },
  { parameter: 'turbine_efficiency', label: 'Efisiensi Turbin', unit: '%' },
];

function connectionMeta(status: MonitoringConnectionStatus) {
  if (status === 'open') {
    return { label: 'Data diperbarui otomatis', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
  }
  if (status === 'connecting' || status === 'reconnecting') {
    return { label: status === 'connecting' ? 'Menghubungkan data' : 'Memulihkan koneksi', className: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'animate-pulse bg-amber-500' };
  }
  if (status === 'error' || status === 'closed') {
    return { label: 'Pembaruan terhenti', className: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' };
  }
  return { label: 'Menyiapkan data', className: 'border-slate-200 bg-slate-50 text-slate-500', dot: 'bg-slate-400' };
}

function timestampValue(parameter: MonitoringParameterLatest): number {
  if (!parameter.time) return 0;
  const timestamp = new Date(parameter.time).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function latestParameter(
  parameters: MonitoringParameterLatest[],
  parameterName: MonitoringParameter,
): MonitoringParameterLatest | undefined {
  return parameters
    .filter((parameter) => parameter.parameter === parameterName)
    .sort((left, right) => timestampValue(right) - timestampValue(left))[0];
}

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(value);
}

export default function RealtimeMonitoringPanel({ pltaId }: RealtimeMonitoringPanelProps) {
  const latestQuery = usePLTALatestQuery(pltaId);
  const stream = useMonitoringStream({ scope: 'plta', id: pltaId });
  const parameters = latestQuery.data?.parameters ?? [];
  const connection = connectionMeta(stream.status);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">Monitoring Telemetering Terkini</h2>
          <p className="mt-0.5 text-xs text-slate-500">Data diperbarui otomatis saat pembacaan terbaru tersedia.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span role="status" className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-semibold ${connection.className}`}>
            <span className={`size-1.5 rounded-full ${connection.dot}`} />
            {connection.label}
          </span>
          {(stream.status === 'error' || stream.status === 'closed') && (
            <button
              type="button"
              onClick={stream.reconnect}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={12} />
              Hubungkan ulang
            </button>
          )}
        </div>
      </div>

      {(latestQuery.isError || stream.error) && (
        <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-800 sm:px-5">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            {latestQuery.isError
              ? 'Data monitoring terbaru belum dapat dimuat dari server.'
              : 'Pembaruan otomatis sedang terganggu. Data terakhir tetap ditampilkan.'}
            {' '}Parameter yang belum diterima tetap ditampilkan sebagai N/A.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4 xl:grid-cols-8">
        {FEATURED_PARAMETERS.map((definition) => {
          const reading = latestParameter(parameters, definition.parameter);
          const hasValue = reading?.value !== null && reading?.value !== undefined;

          return (
            <div key={definition.parameter} className="min-w-0 bg-white px-3.5 py-3.5">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400" title={definition.label}>
                {definition.label}
              </p>
              <div className="mt-2 flex min-w-0 items-baseline gap-1">
                <span className={`truncate font-mono text-base font-bold ${hasValue ? 'text-slate-900' : 'text-slate-400'}`}>
                  {formatValue(reading?.value)}
                </span>
                {hasValue && definition.unit && (
                  <span className="truncate text-[9px] font-medium text-slate-400">{definition.unit}</span>
                )}
              </div>
              <p className="mt-1 truncate text-[10px] text-slate-400" title={reading?.station || undefined}>
                {reading?.station || 'Stasiun N/A'}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
