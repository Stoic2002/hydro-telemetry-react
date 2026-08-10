import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  AlertTriangle,
  Info,
  PencilLine,
  RefreshCw,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import {
  useMonitoringStream,
  usePLTALatestQuery,
} from '../../features/monitoring';
import {
  useActivePLTA,
  usePLTATagsQuery,
} from '../../features/plta/api/queries';
import {
  useMonthlyHydrologyImageQuery,
  useMonthlyHydrologyQuery,
  usePLTAHydrologyDashboardQuery,
} from '../../features/hydrology/api/queries';
import { getHydrologyErrorMessage } from '../../features/hydrology/error';
import MonthlyHydrologySheet from '../../features/hydrology/components/MonthlyHydrologySheet';
import HydrologyImageUploadSheet from '../../features/hydrology/components/HydrologyImageUploadSheet';
import type { MonthlyHydrologyImageKind } from '../../features/hydrology/model';
import TelemetryUploadSheet from '../../features/telemetry-upload/components/TelemetryUploadSheet';
import type { DailyTelemetryUploadTarget } from '../../features/telemetry-upload/model';
import HydrologySpatialLayout from './telemetering/HydrologySpatialLayout';
import {
  ForecastDetail,
  ForecastMapCard,
  MonthlyTable,
} from './telemetering/MonthlyHydrologyPanels';
import { useObjectUrl } from './telemetering/useObjectUrl';
import {
  MONTHS,
  buildMonthlyForecastRows,
  buildUploadTarget,
  currentWibDate,
  dashboardMetricRows,
  formatHydrologyDate,
  latestMonitoringParameter,
  monitoringSource,
  type MetricSection,
} from './telemetering/presentation';

export default function Telemetering() {
  const { plant, plta, pltaId } = useActivePLTA();
  const operationYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const [isMonthlySheetOpen, setIsMonthlySheetOpen] = useState(false);
  const [imageUploadKind, setImageUploadKind] = useState<MonthlyHydrologyImageKind | null>(null);
  const [dailyUploadTarget, setDailyUploadTarget] =
    useState<DailyTelemetryUploadTarget | null>(null);
  const closeMonthlySheet = useCallback(() => setIsMonthlySheetOpen(false), []);
  const closeImageUploadSheet = useCallback(() => setImageUploadKind(null), []);
  const closeDailyUploadSheet = useCallback(() => setDailyUploadTarget(null), []);
  const selectedMonth = MONTHS[currentMonthIndex];
  const selectedMonthNumber = currentMonthIndex + 1;
  const dashboardQuery = usePLTAHydrologyDashboardQuery(pltaId);
  const monthlyQuery = useMonthlyHydrologyQuery(pltaId, operationYear);
  const uploadTagsQuery = usePLTATagsQuery(pltaId, {
    page: 1,
    limit: 200,
    protocol: 'upload',
    enabled: true,
  });
  const monitoringQuery = usePLTALatestQuery(pltaId, false);
  const monitoringStream = useMonitoringStream({
    scope: 'plta',
    id: pltaId,
    bootstrapLatest: false,
  });
  const monthlyRecords = useMemo(() => {
    const records = monthlyQuery.data ?? [];
    const dashboardMonthly = dashboardQuery.data?.monthly;

    if (!dashboardMonthly || dashboardMonthly.year !== operationYear) {
      return records;
    }

    return [
      dashboardMonthly,
      ...records.filter((record) => record.month !== dashboardMonthly.month),
    ];
  }, [dashboardQuery.data?.monthly, monthlyQuery.data, operationYear]);
  const selectedMonthlyRecord = monthlyRecords.find(
    (item) => item.month === selectedMonthNumber,
  );
  const rainfallImageQuery = useMonthlyHydrologyImageQuery(
    pltaId,
    operationYear,
    selectedMonthNumber,
    'curah_hujan',
    Boolean(selectedMonthlyRecord?.rainfallImage),
  );
  const rainfallCharacteristicImageQuery = useMonthlyHydrologyImageQuery(
    pltaId,
    operationYear,
    selectedMonthNumber,
    'sifat_hujan',
    Boolean(selectedMonthlyRecord?.rainfallCharacteristicImage),
  );
  const rainfallImageUrl = useObjectUrl(rainfallImageQuery.data);
  const rainfallCharacteristicImageUrl = useObjectUrl(
    rainfallCharacteristicImageQuery.data,
  );
  const daily = dashboardQuery.data?.daily ?? null;
  const uploadTags = uploadTagsQuery.isPlaceholderData
    ? undefined
    : uploadTagsQuery.data?.items;
  const dailyUploadTargets = useMemo(() => ({
    targetTma: buildUploadTarget(
      uploadTags ?? [],
      'plan_water_level',
      'Target tinggi muka air waduk (TMA)',
      'mdpl',
    ),
    plannedTurbineDischarge: buildUploadTarget(
      uploadTags ?? [],
      'plan_outflow_turbine',
      'Rencana debit turbin',
      'm³/detik',
    ),
    plannedSpillwayDischarge: buildUploadTarget(
      uploadTags ?? [],
      'plan_outflow_spillway',
      'Rencana debit spillway',
      'm³/detik',
    ),
    plannedHjvDischarge: buildUploadTarget(
      uploadTags ?? [],
      'plan_outflow_hjv',
      'Rencana debit HJV',
      'm³/detik',
    ),
    spillwayDischarge: buildUploadTarget(
      uploadTags ?? [],
      'outflow_spillway',
      'Debit spillway',
      'm³/detik',
    ),
    hjvDischarge: buildUploadTarget(
      uploadTags ?? [],
      'outflow_hjv',
      'Debit HJV',
      'm³/detik',
    ),
  }), [uploadTags]);
  const monitoringParameters = monitoringQuery.data?.parameters ?? [];
  const reservoirReading = latestMonitoringParameter(
    monitoringParameters,
    'reservoir',
    [],
    true,
  );
  const tailraceReading = latestMonitoringParameter(
    monitoringParameters,
    'water_level',
    ['tailrace', 'trailrace', 'hilir', 'downstream'],
  );
  const turbineDischargeReading = latestMonitoringParameter(
    monitoringParameters,
    'total_outflow',
    ['turbin', 'turbine', 'powerhouse', 'unit'],
    true,
  );
  const isDailyLoading = dashboardQuery.isLoading;
  const reservoirOverride = useMemo(() => reservoirReading?.value === undefined
    ? undefined
    : {
      value: reservoirReading.value,
      source: monitoringSource(reservoirReading),
    }, [reservoirReading]);
  const tailraceOverride = useMemo(() => tailraceReading?.value === undefined
    ? undefined
    : {
      value: tailraceReading.value,
      source: monitoringSource(tailraceReading),
    }, [tailraceReading]);
  const turbineDischargeOverride = useMemo(() => turbineDischargeReading?.value === undefined
    ? undefined
    : {
      value: turbineDischargeReading.value,
      source: monitoringSource(turbineDischargeReading),
    }, [turbineDischargeReading]);
  const forecastRows = useMemo(
    () => buildMonthlyForecastRows(selectedMonthlyRecord, selectedMonth),
    [selectedMonth, selectedMonthlyRecord],
  );

  const upstreamSections = useMemo<MetricSection[]>(() => [{
    title: 'Parameter hulu',
    rows: dashboardMetricRows(
      daily?.upstream,
      isDailyLoading,
      { target_tma: dailyUploadTargets.targetTma },
      { tma_waduk: reservoirOverride },
      ['target_tma', 'tma_waduk', 'inflow', 'curah_hujan', 'volume_waduk'],
    ),
  }], [
    daily?.upstream,
    dailyUploadTargets.targetTma,
    isDailyLoading,
    reservoirOverride,
  ]);

  const damSections = useMemo<MetricSection[]>(() => [{
    title: 'Parameter bendungan dan pelepasan',
    rows: dashboardMetricRows(
      daily?.dam,
      isDailyLoading,
      {
        rencana_debit_turbin_unit_1: dailyUploadTargets.plannedTurbineDischarge,
        rencana_debit_turbin_unit_2: dailyUploadTargets.plannedTurbineDischarge,
        rencana_debit_turbin_unit_3: dailyUploadTargets.plannedTurbineDischarge,
        rencana_debit_turbin_unit_4: dailyUploadTargets.plannedTurbineDischarge,
        rencana_debit_spillway: dailyUploadTargets.plannedSpillwayDischarge,
        rencana_debit_hjv: dailyUploadTargets.plannedHjvDischarge,
        debit_spillway: dailyUploadTargets.spillwayDischarge,
        debit_hjv: dailyUploadTargets.hjvDischarge,
      },
      { debit_turbin_total: turbineDischargeOverride },
      ['debit_turbin_total', 'debit_spillway', 'debit_irigasi', 'debit_ddc', 'delta_head'],
    ),
  }], [
    daily?.dam,
    dailyUploadTargets.hjvDischarge,
    dailyUploadTargets.plannedHjvDischarge,
    dailyUploadTargets.plannedSpillwayDischarge,
    dailyUploadTargets.plannedTurbineDischarge,
    dailyUploadTargets.spillwayDischarge,
    isDailyLoading,
    turbineDischargeOverride,
  ]);

  const downstreamSections = useMemo<MetricSection[]>(() => [{
    title: 'Parameter hilir',
    rows: dashboardMetricRows(
      daily?.downstream,
      isDailyLoading,
      {},
      { tma_tailrace: tailraceOverride },
      ['tma_tailrace', 'head', 'swc_unit_1', 'turbidity_hilir', 'ph_hilir'],
    ),
  }], [
    daily?.downstream,
    isDailyLoading,
    tailraceOverride,
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5 animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <h1 className="page-title">Telemetering</h1>
        <PlantSwitcher page="telemetering" />
      </header>

      <section className="border-t border-[#e2e8f0] pt-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 className="text-base font-semibold text-[#0f172a]">Hidrologi Bulanan</h2>
          <span className="text-xs font-medium text-[#64748b]">{operationYear}</span>
        </div>

        {monthlyQuery.isError && (
          <div className="mb-4 flex flex-col gap-3 border-y border-red-100 bg-red-50/50 px-4 py-3 text-xs text-red-600 sm:flex-row sm:items-center sm:justify-between">
            <span>{getHydrologyErrorMessage(monthlyQuery.error)}</span>
            <button
              type="button"
              onClick={() => void monthlyQuery.refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start font-semibold hover:text-red-700"
            >
              <RefreshCw size={13} />
              Coba lagi
            </button>
          </div>
        )}

        <MonthlyTable
          currentMonthIndex={currentMonthIndex}
          records={monthlyRecords}
          isLoading={monthlyQuery.isLoading}
        />

        <div className="mt-5 border-t border-[#e2e8f0] pt-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(380px,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Ringkasan {selectedMonth}</h2>
                </div>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<PencilLine size={15} />}
                  disabled={monthlyQuery.isLoading}
                  onClick={() => setIsMonthlySheetOpen(true)}
                  className="h-9 shrink-0 whitespace-nowrap"
                >
                  Input Data Bulanan
                </Button>
              </div>
              <div className="mt-4">
                <ForecastDetail rows={forecastRows} />
              </div>
            </div>
            <div className="border-t border-[#e2e8f0] pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-[#0f172a]">Prakiraan Hujan</h3>
              </div>
              <div className="grid gap-4">
                <ForecastMapCard
                  title="Prakiraan Curah Hujan"
                  subtitle={`${selectedMonth} ${operationYear}`}
                  imageUrl={rainfallImageUrl}
                  isLoading={rainfallImageQuery.isLoading}
                  isError={rainfallImageQuery.isError}
                  onUpload={!monthlyQuery.isLoading && !selectedMonthlyRecord?.rainfallImage
                    ? () => setImageUploadKind('curah_hujan')
                    : undefined}
                />
                <ForecastMapCard
                  title="Prakiraan Sifat Hujan"
                  subtitle="Terhadap kondisi klimatologis"
                  imageUrl={rainfallCharacteristicImageUrl}
                  isLoading={rainfallCharacteristicImageQuery.isLoading}
                  isError={rainfallCharacteristicImageQuery.isError}
                  onUpload={!monthlyQuery.isLoading && !selectedMonthlyRecord?.rainfallCharacteristicImage
                    ? () => setImageUploadKind('sifat_hujan')
                    : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-start gap-2 border-y border-[#e2e8f0] py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-[#64748b]" />
        <p className="text-xs leading-5 text-[#64748b]">
          Prediksi hidrologi belum mempertimbangkan kebutuhan alokasi air, kesiapan unit
          pembangkit, dan kebutuhan sistem kelistrikan.
        </p>
      </div>

      <section className="border-t border-[#e2e8f0] pt-5">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Hidrologi Harian</h2>
            {daily && (
              <p className="mt-1 text-xs text-[#64748b]">{formatHydrologyDate(daily.date)}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium">
            <span className={monitoringStream.status === 'open' ? 'text-emerald-600' : 'text-amber-600'}>
              {monitoringStream.status === 'open' ? 'Realtime aktif' : 'Realtime belum aktif'}
            </span>
            {(uploadTags?.length ?? 0) > 0 && (
              <span className="text-cyan-700">Input</span>
            )}
            <span className="text-[#b45309]">Formulasi</span>
            <span className="text-[#94a3b8]">Konstanta</span>
            <span className="inline-flex items-center gap-1 text-[#dc2626]">
              <AlertTriangle size={11} />
              Belum tersedia
            </span>
            {(monitoringStream.status === 'error' || monitoringStream.status === 'closed') && (
              <button
                type="button"
                onClick={monitoringStream.reconnect}
                className="inline-flex cursor-pointer items-center gap-1 text-red-600 hover:text-red-700"
              >
                <RefreshCw size={11} />
                Hubungkan ulang
              </button>
            )}
          </div>
        </div>

        {dashboardQuery.isError && (
          <div className="mb-5 flex flex-col gap-3 border-y border-red-100 bg-red-50/50 px-4 py-3 text-xs text-red-600 sm:flex-row sm:items-center sm:justify-between">
            <span>{getHydrologyErrorMessage(dashboardQuery.error)}</span>
            <button
              type="button"
              onClick={() => void dashboardQuery.refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start font-semibold hover:text-red-700"
            >
              <RefreshCw size={13} />
              Coba lagi
            </button>
          </div>
        )}

        {uploadTagsQuery.isError && (
          <div className="mb-5 flex flex-col gap-3 border-y border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-700 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Katalog input manual belum dapat dimuat. Data monitoring tetap tersedia.
            </span>
            <button
              type="button"
              onClick={() => void uploadTagsQuery.refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start font-semibold hover:text-amber-800"
            >
              <RefreshCw size={13} />
              Coba lagi
            </button>
          </div>
        )}

        {daily && daily.pendingFormulas.length > 0 && (
          <div className="mb-5 flex items-start gap-2 border-y border-amber-100 bg-amber-50/60 px-4 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-xs leading-5 text-amber-700">
              {daily.pendingFormulas.length} formula masih menunggu data:
              {' '}
              {daily.pendingFormulas.join(', ')}
            </p>
          </div>
        )}

        <HydrologySpatialLayout
          plant={plant}
          plantName={plta.shortName}
          upstreamSections={upstreamSections}
          damSections={damSections}
          downstreamSections={downstreamSections}
          onUpload={setDailyUploadTarget}
        />
      </section>

      {isMonthlySheetOpen && (
        <MonthlyHydrologySheet
          isOpen
          pltaId={pltaId}
          plantName={plta.shortName}
          year={operationYear}
          month={selectedMonthNumber}
          monthLabel={selectedMonth}
          record={selectedMonthlyRecord}
          onClose={closeMonthlySheet}
        />
      )}

      {imageUploadKind && (
        <HydrologyImageUploadSheet
          isOpen
          pltaId={pltaId}
          plantName={plta.shortName}
          year={operationYear}
          month={selectedMonthNumber}
          monthLabel={selectedMonth}
          kind={imageUploadKind}
          onClose={closeImageUploadSheet}
        />
      )}

      {dailyUploadTarget && (
        <TelemetryUploadSheet
          isOpen
          pltaId={pltaId}
          plantName={plta.shortName}
          defaultDate={daily?.date ?? currentWibDate()}
          target={dailyUploadTarget}
          onClose={closeDailyUploadSheet}
        />
      )}
    </div>
  );
}
