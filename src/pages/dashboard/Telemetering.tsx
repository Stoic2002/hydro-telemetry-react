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
import { PlantSwitcher, useActivePLTA, usePLTATagsQuery } from '../../features/plta';
import {
  useMonitoringStream,
  usePLTALatestQuery,
} from '../../features/monitoring';
import {
  getHydrologyErrorMessage,
  HydrologyImageUploadSheet,
  MonthlyHydrologySheet,
  useMonthlyHydrologyImageQuery,
  useMonthlyHydrologyQuery,
  usePLTAHydrologyDashboardQuery,
} from '../../features/hydrology';
import type { MonthlyHydrologyImageKind } from '../../features/hydrology';
import { TelemetryUploadSheet } from '../../features/telemetry-upload';
import type { DailyTelemetryUploadTarget } from '../../features/telemetry-upload';
import HydrologySpatialLayout from './telemetering/HydrologySpatialLayout';
import SourceMarker from '../../components/atoms/SourceMarker';
import Banner from '../../components/ui/Banner';
import PageHeader from '../../components/ui/PageHeader';
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
  // Tombol berubah jadi "Edit data" begitu data bulan berjalan sudah ada.
  const hasMonthlyRecord = Boolean(selectedMonthlyRecord);
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
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Telemetering"
        description={`Pantau kondisi hidrologi harian dan bulanan PLTA ${plta.shortName}`}
        actions={<PlantSwitcher page="telemetering" />}
      />

      <section>
        <div className="mb-3.5 flex items-baseline justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Bagian 1
            </p>
            <h2 className="section-title mt-1">Hidrologi Bulanan</h2>
          </div>
          <span className="font-mono text-xs font-medium text-text-muted">{operationYear}</span>
        </div>

        {monthlyQuery.isError && (
          <Banner tone="warning" title="Hidrologi bulanan belum lengkap" className="mb-4">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {getHydrologyErrorMessage(monthlyQuery.error)}
              <button
                type="button"
                onClick={() => void monthlyQuery.refetch()}
                className="inline-flex cursor-pointer items-center gap-1 font-semibold underline underline-offset-2"
              >
                <RefreshCw size={11} />
                Coba lagi
              </button>
            </span>
          </Banner>
        )}

        <MonthlyTable
          currentMonthIndex={currentMonthIndex}
          records={monthlyRecords}
          isLoading={monthlyQuery.isLoading}
        />

        <div className="mt-5">
          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="card-title">Ringkasan {selectedMonth}</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<PencilLine size={13} />}
                  disabled={monthlyQuery.isLoading}
                  onClick={() => setIsMonthlySheetOpen(true)}
                  className="shrink-0 whitespace-nowrap text-brand-primary-strong"
                >
                  {hasMonthlyRecord ? 'Edit data' : 'Input data'}
                </Button>
              </div>
              <div className="mt-2.5">
                <ForecastDetail rows={forecastRows} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="card-title">Prakiraan Hujan</h3>
                <span className="shrink-0 text-[11px] text-text-muted">Sumber gambar BMKG</span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-3">
                <ForecastMapCard
                  title="Curah Hujan"
                  subtitle={`${selectedMonth} ${operationYear}`}
                  imageUrl={rainfallImageUrl}
                  isLoading={rainfallImageQuery.isLoading}
                  isError={rainfallImageQuery.isError}
                  onUpload={!monthlyQuery.isLoading && !selectedMonthlyRecord?.rainfallImage
                    ? () => setImageUploadKind('curah_hujan')
                    : undefined}
                />
                <ForecastMapCard
                  title="Sifat Hujan"
                  subtitle={`${selectedMonth} ${operationYear}`}
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
        <div className="mt-4 flex items-start gap-2">
          <Info size={14} className="mt-0.5 shrink-0 text-text-muted" />
          <p className="max-w-[88ch] text-[11.5px] leading-[1.6] text-text-muted">
            Prediksi hidrologi belum mempertimbangkan kebutuhan alokasi air, kesiapan unit
            pembangkit, dan kebutuhan sistem kelistrikan.
          </p>
        </div>
      </section>

      {/* Garis #cbd5e1 lebih tegas dari garis biasa — ini batas antar bagian besar. */}
      <section className="border-t border-border-strong pt-6">
        <div className="mb-3.5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Bagian 2
            </p>
            <h2 className="section-title mt-1">Hidrologi Harian</h2>
            {daily && (
              <p className="mt-1 text-xs text-text-muted">{formatHydrologyDate(daily.date)}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] font-medium uppercase tracking-[0.04em] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${monitoringStream.status === 'open' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {monitoringStream.status === 'open' ? 'Realtime aktif' : 'Realtime belum aktif'}
            </span>
            <span className="flex items-center gap-1.5"><SourceMarker type="formula" />Formulasi</span>
            {(uploadTags?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1.5"><SourceMarker type="input" />Input</span>
            )}
            <span className="flex items-center gap-1.5"><SourceMarker type="constant" />Konstanta</span>
            <span className="flex items-center gap-1.5"><SourceMarker type="unavailable" />Belum tersedia</span>
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
          <Banner tone="warning" title="Sebagian data harian belum lengkap" className="mb-5">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {getHydrologyErrorMessage(dashboardQuery.error)}
              <button
                type="button"
                onClick={() => void dashboardQuery.refetch()}
                className="inline-flex cursor-pointer items-center gap-1 font-semibold underline underline-offset-2"
              >
                <RefreshCw size={11} />
                Coba lagi
              </button>
            </span>
          </Banner>
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
