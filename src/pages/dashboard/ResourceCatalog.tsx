import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
  Search,
  Tags,
  Waves,
} from 'lucide-react';
import Skeleton from '../../components/atoms/Skeleton';
import Select from '../../components/atoms/Select';
import ResourceTableSkeleton from '../../components/skeletons/ResourceTableSkeleton';
import {
  usePlantCatalogQuery,
  usePLTAListQuery,
  usePLTATagsQuery,
  useRiverBasinsQuery,
} from '../../features/plta/api/queries';
import { getPLTAErrorMessage } from '../../features/plta/error';
import type {
  PlantTagListParams,
  PlantTagProtocol,
} from '../../features/plta/model';

const PAGE_LIMIT = 10;
const RIVER_BASIN_LOOKUP_LIMIT = 200;

const TAG_PROTOCOLS: PlantTagProtocol[] = [
  'opcua',
  'modbus',
  'sql',
  'rest',
  'upload',
];

type CatalogView = 'ws' | 'plta' | 'tags';

interface CatalogColumn {
  key: string;
  label: string;
  className?: string;
}

interface CatalogTableProps {
  columns: CatalogColumn[];
  minWidthClassName: string;
  searchInput: string;
  searchPlaceholder: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onClearSearch?: () => void;
  filters?: ReactNode;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  page: number;
  totalPages: number;
  total: number;
  itemLabel: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
  children: ReactNode;
}

function parseCatalogView(value: string | null): CatalogView {
  return value === 'plta' || value === 'tags' ? value : 'ws';
}

function formatCoordinate(value: number | null): string {
  return value === null ? '—' : value.toFixed(5);
}

function CatalogTabs({
  activeView,
  onChange,
}: {
  activeView: CatalogView;
  onChange: (view: CatalogView) => void;
}) {
  const tabs: Array<{ value: CatalogView; label: string; icon: ReactNode }> = [
    { value: 'ws', label: 'Wilayah Sungai', icon: <Waves size={16} /> },
    { value: 'plta', label: 'PLTA', icon: <Building2 size={16} /> },
    { value: 'tags', label: 'Tag & Parameter', icon: <Tags size={16} /> },
  ];

  return (
    <div
      role="tablist"
      aria-label="Jenis katalog monitoring"
      className="grid w-full grid-cols-1 gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit sm:grid-cols-3"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeView;

        return (
          <button
            key={tab.value}
            id={`catalog-tab-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`catalog-panel-${tab.value}`}
            onClick={() => onChange(tab.value)}
            className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/30 ${
              isActive
                ? 'bg-white text-brand-primary-strong'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function StateTableRow({
  colSpan,
  icon,
  title,
  description,
  action,
}: {
  colSpan: number;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-14 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            {icon}
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

function CatalogTable({
  columns,
  minWidthClassName,
  searchInput,
  searchPlaceholder,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  filters,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyDescription,
  page,
  totalPages,
  total,
  itemLabel,
  onPreviousPage,
  onNextPage,
  children,
}: CatalogTableProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const lastItem = Math.min(page * PAGE_LIMIT, total);

  return (
    <section className="flex flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 lg:px-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <form onSubmit={onSearch} className="flex min-w-0 flex-1 items-center gap-2.5 2xl:max-w-xl">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            maxLength={100}
            placeholder={searchPlaceholder}
            className="h-8 min-w-0 flex-1 border-0 bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
          />
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="h-8 cursor-pointer rounded-lg border-0 bg-transparent px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Bersihkan
            </button>
          )}
          <button
            type="submit"
            className="h-8 shrink-0 cursor-pointer rounded-lg border-0 bg-slate-100 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cari
          </button>
        </form>

        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      </div>

      <div className="h-0.5 bg-transparent">
        {isFetching && !isLoading && <Skeleton className="h-full w-full" />}
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full border-collapse ${minWidthClassName}`}>
          <thead>
            <tr className="h-11 border-b border-slate-200 bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-5 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 ${column.className ?? ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody aria-busy={isLoading || isFetching}>
            {isLoading ? (
              <ResourceTableSkeleton rows={PAGE_LIMIT} columns={columns.length} />
            ) : isError ? (
              <StateTableRow
                colSpan={columns.length}
                icon={<RefreshCw size={19} />}
                title="Data belum dapat dimuat"
                description={errorMessage ?? 'Terjadi kesalahan saat mengambil data dari server.'}
                action={(
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <RefreshCw size={14} />
                    Coba Lagi
                  </button>
                )}
              />
            ) : isEmpty ? (
              <StateTableRow
                colSpan={columns.length}
                icon={<Search size={19} />}
                title={emptyTitle}
                description={emptyDescription}
              />
            ) : children}
          </tbody>
        </table>
      </div>

      {!isLoading && !isError && (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-5">
          <div className="text-xs text-slate-400">
            {isFetching ? 'Memperbarui... · ' : ''}
            Menampilkan {firstItem}–{lastItem} dari {total} {itemLabel}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              disabled={page <= 1 || isFetching}
              onClick={onPreviousPage}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="min-w-20 text-center text-xs font-semibold text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isFetching}
              onClick={onNextPage}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function RiverBasinsCatalog() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const riverBasinsQuery = useRiverBasinsQuery({
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
  });
  const plantsCatalogQuery = usePlantCatalogQuery();

  const plantCountsByRiverBasin = useMemo(() => {
    const counts = new Map<string, number>();

    for (const plant of plantsCatalogQuery.data ?? []) {
      counts.set(plant.riverBasinId, (counts.get(plant.riverBasinId) ?? 0) + 1);
    }

    return counts;
  }, [plantsCatalogQuery.data]);

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

  const riverBasins = riverBasinsQuery.data?.items ?? [];
  const totalPages = Math.max(riverBasinsQuery.data?.pages ?? 1, 1);

  return (
    <CatalogTable
      columns={[
        { key: 'code', label: 'Kode', className: 'w-32' },
        { key: 'name', label: 'Wilayah Sungai' },
        { key: 'description', label: 'Deskripsi', className: 'w-[38%]' },
        { key: 'plants', label: 'Jumlah PLTA', className: 'w-36 text-center' },
      ]}
      minWidthClassName="min-w-[760px]"
      searchInput={searchInput}
      searchPlaceholder="Cari kode, nama, atau deskripsi wilayah sungai..."
      onSearchInputChange={setSearchInput}
      onSearch={applySearch}
      onClearSearch={search || searchInput ? clearSearch : undefined}
      isLoading={riverBasinsQuery.isLoading}
      isFetching={riverBasinsQuery.isFetching || plantsCatalogQuery.isFetching}
      isError={riverBasinsQuery.isError}
      errorMessage={riverBasinsQuery.isError ? getPLTAErrorMessage(riverBasinsQuery.error) : undefined}
      onRetry={() => {
        void riverBasinsQuery.refetch();
        if (plantsCatalogQuery.isError) void plantsCatalogQuery.refetch();
      }}
      isEmpty={riverBasins.length === 0}
      emptyTitle={search ? 'Wilayah sungai tidak ditemukan' : 'Belum ada wilayah sungai'}
      emptyDescription={search ? 'Coba gunakan kata kunci lain atau bersihkan pencarian.' : 'Server belum memiliki data wilayah sungai yang dapat ditampilkan.'}
      page={page}
      totalPages={totalPages}
      total={riverBasinsQuery.data?.total ?? 0}
      itemLabel="wilayah sungai"
      onPreviousPage={() => setPage((current) => Math.max(current - 1, 1))}
      onNextPage={() => setPage((current) => Math.min(current + 1, totalPages))}
    >
      {riverBasins.map((riverBasin) => (
        <tr key={riverBasin.id} className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60">
          <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-600">{riverBasin.code}</td>
          <td className="px-5 py-4 text-sm font-semibold text-slate-900">{riverBasin.name}</td>
          <td className="px-5 py-4 text-xs leading-5 text-slate-500">
            <span className="line-clamp-2">{riverBasin.description || '—'}</span>
          </td>
          <td className="px-5 py-4 text-center text-sm font-semibold text-slate-700">
            {plantsCatalogQuery.isPending ? (
              <Skeleton className="mx-auto h-3.5 w-8 rounded-md" />
            ) : plantsCatalogQuery.isError ? '—' : (plantCountsByRiverBasin.get(riverBasin.id) ?? 0)}
          </td>
        </tr>
      ))}
    </CatalogTable>
  );
}

function PlantsCatalog({ onOpenTags }: { onOpenTags: (pltaId: string) => void }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const plantsQuery = usePLTAListQuery({
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
  });
  const riverBasinsQuery = useRiverBasinsQuery({
    page: 1,
    limit: RIVER_BASIN_LOOKUP_LIMIT,
  });

  const riverBasinNames = useMemo(() => new Map(
    (riverBasinsQuery.data?.items ?? []).map((riverBasin) => [riverBasin.id, riverBasin.name] as const),
  ), [riverBasinsQuery.data?.items]);

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

  const plants = plantsQuery.data?.items ?? [];
  const totalPages = Math.max(plantsQuery.data?.pages ?? 1, 1);
  const lookupError = riverBasinsQuery.isError ? riverBasinsQuery.error : undefined;
  const tableError = plantsQuery.isError ? plantsQuery.error : lookupError;

  return (
    <CatalogTable
      columns={[
        { key: 'plant', label: 'PLTA', className: 'min-w-52' },
        { key: 'river-basin', label: 'Wilayah Sungai', className: 'min-w-44' },
        { key: 'capacity', label: 'Kapasitas', className: 'w-32' },
        { key: 'coordinates', label: 'Koordinat', className: 'min-w-52' },
        { key: 'status', label: 'Status', className: 'w-28' },
        { key: 'action', label: 'Aksi', className: 'w-36' },
      ]}
      minWidthClassName="min-w-[1040px]"
      searchInput={searchInput}
      searchPlaceholder="Cari kode, nama, atau deskripsi PLTA..."
      onSearchInputChange={setSearchInput}
      onSearch={applySearch}
      onClearSearch={search || searchInput ? clearSearch : undefined}
      isLoading={plantsQuery.isLoading || riverBasinsQuery.isLoading}
      isFetching={plantsQuery.isFetching || riverBasinsQuery.isFetching}
      isError={Boolean(tableError)}
      errorMessage={tableError ? getPLTAErrorMessage(tableError) : undefined}
      onRetry={() => {
        void plantsQuery.refetch();
        void riverBasinsQuery.refetch();
      }}
      isEmpty={plants.length === 0}
      emptyTitle={search ? 'PLTA tidak ditemukan' : 'Belum ada PLTA'}
      emptyDescription={search ? 'Coba gunakan kata kunci lain atau bersihkan pencarian.' : 'Server belum memiliki data PLTA yang dapat ditampilkan.'}
      page={page}
      totalPages={totalPages}
      total={plantsQuery.data?.total ?? 0}
      itemLabel="PLTA"
      onPreviousPage={() => setPage((current) => Math.max(current - 1, 1))}
      onNextPage={() => setPage((current) => Math.min(current + 1, totalPages))}
    >
      {plants.map((plant) => (
        <tr key={plant.id} className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60">
          <td className="px-5 py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-slate-900">{plant.name}</span>
              <span className="font-mono text-[11px] font-medium text-slate-400">{plant.code}</span>
            </div>
          </td>
          <td className="px-5 py-4 text-sm text-slate-600">
            {riverBasinNames.get(plant.riverBasinId) ?? 'Wilayah sungai tidak ditemukan'}
          </td>
          <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
            {plant.capacityMw === null
              ? '—'
              : `${plant.capacityMw.toLocaleString('id-ID', { maximumFractionDigits: 2 })} MW`}
          </td>
          <td className="px-5 py-4 font-mono text-xs text-slate-500">
            {formatCoordinate(plant.latitude)}, {formatCoordinate(plant.longitude)}
          </td>
          <td className="px-5 py-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              plant.isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              <span className={`size-1.5 rounded-full ${plant.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {plant.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </td>
          <td className="px-5 py-4">
            <button
              type="button"
              onClick={() => onOpenTags(plant.id)}
              className="cursor-pointer rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-brand-primary-strong hover:bg-cyan-100"
            >
              Lihat Parameter
            </button>
          </td>
        </tr>
      ))}
    </CatalogTable>
  );
}

function TagsCatalog({
  requestedPlantId,
  onPlantChange,
}: {
  requestedPlantId: string;
  onPlantChange: (pltaId: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [protocol, setProtocol] = useState<PlantTagProtocol | ''>('');
  const [enabled, setEnabled] = useState<'' | 'true' | 'false'>('');
  const plantsCatalogQuery = usePlantCatalogQuery();
  const plants = plantsCatalogQuery.data ?? [];
  const fallbackPlantId = (plants.find((plant) => plant.isActive) ?? plants[0])?.id ?? '';
  const selectedPlantId = plants.some((plant) => plant.id === requestedPlantId)
    ? requestedPlantId
    : fallbackPlantId;
  const tagParams: PlantTagListParams = {
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
    protocol: protocol || undefined,
    enabled: enabled === '' ? undefined : enabled === 'true',
  };
  const tagsQuery = usePLTATagsQuery(selectedPlantId, tagParams);

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

  const tagsData = tagsQuery.data?.items ?? [];
  const totalPages = Math.max(tagsQuery.data?.pages ?? 1, 1);
  const tableError = plantsCatalogQuery.isError
    ? plantsCatalogQuery.error
    : tagsQuery.isError
      ? tagsQuery.error
      : undefined;

  const filters = (
    <>
      <Select
        id="catalog-plant-filter"
        aria-label="Pilih PLTA"
        value={selectedPlantId}
        disabled={plantsCatalogQuery.isPending || plants.length === 0}
        onChange={(event) => {
          onPlantChange(event.target.value);
          setPage(1);
        }}
        className="max-w-full sm:w-64"
        controlSize="sm"
        leadingIcon={<Building2 />}
        options={plants.length === 0
          ? [{ value: '', label: 'Belum ada PLTA' }]
          : plants.map((plant) => ({ value: plant.id, label: `${plant.name} · ${plant.code}` }))}
      />

      <Select
        id="catalog-protocol-filter"
        aria-label="Filter protokol"
        value={protocol}
        onChange={(event) => {
          setProtocol(event.target.value as PlantTagProtocol | '');
          setPage(1);
        }}
        className="w-full sm:w-44"
        controlSize="sm"
        leadingIcon={<Database />}
        options={[
          { value: '', label: 'Semua protokol' },
          ...TAG_PROTOCOLS.map((item) => ({ value: item, label: item.toUpperCase() })),
        ]}
      />

      <Select
        id="catalog-status-filter"
        aria-label="Filter status tag"
        value={enabled}
        onChange={(event) => {
          setEnabled(event.target.value as '' | 'true' | 'false');
          setPage(1);
        }}
        className="w-full sm:w-40"
        controlSize="sm"
        leadingIcon={<Tags />}
        options={[
          { value: '', label: 'Semua status' },
          { value: 'true', label: 'Aktif' },
          { value: 'false', label: 'Nonaktif' },
        ]}
      />
    </>
  );

  return (
    <CatalogTable
      columns={[
        { key: 'parameter', label: 'Parameter', className: 'min-w-48' },
        { key: 'station', label: 'Stasiun', className: 'min-w-40' },
        { key: 'protocol', label: 'Protokol', className: 'w-28' },
        { key: 'address', label: 'Alamat', className: 'min-w-60' },
        { key: 'calibration', label: 'Scale / Offset', className: 'w-36' },
        { key: 'unit', label: 'Satuan', className: 'w-28' },
        { key: 'status', label: 'Status', className: 'w-28' },
      ]}
      minWidthClassName="min-w-[1120px]"
      searchInput={searchInput}
      searchPlaceholder="Cari parameter, stasiun, protokol, atau alamat..."
      onSearchInputChange={setSearchInput}
      onSearch={applySearch}
      onClearSearch={search || searchInput ? clearSearch : undefined}
      filters={filters}
      isLoading={plantsCatalogQuery.isLoading || (Boolean(selectedPlantId) && tagsQuery.isLoading)}
      isFetching={plantsCatalogQuery.isFetching || tagsQuery.isFetching}
      isError={Boolean(tableError)}
      errorMessage={tableError ? getPLTAErrorMessage(tableError) : undefined}
      onRetry={() => {
        void plantsCatalogQuery.refetch();
        if (selectedPlantId) void tagsQuery.refetch();
      }}
      isEmpty={!selectedPlantId || tagsData.length === 0}
      emptyTitle={!selectedPlantId ? 'Belum ada PLTA' : search || protocol || enabled ? 'Tag tidak ditemukan' : 'Belum ada tag dan parameter'}
      emptyDescription={!selectedPlantId ? 'Tambahkan data PLTA terlebih dahulu sebelum melihat konfigurasi tag.' : search || protocol || enabled ? 'Coba ubah kata kunci atau filter yang digunakan.' : 'PLTA yang dipilih belum memiliki konfigurasi tag monitoring.'}
      page={page}
      totalPages={totalPages}
      total={tagsQuery.data?.total ?? 0}
      itemLabel="tag"
      onPreviousPage={() => setPage((current) => Math.max(current - 1, 1))}
      onNextPage={() => setPage((current) => Math.min(current + 1, totalPages))}
    >
      {tagsData.map((tag) => (
        <tr key={tag.id} className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60">
          <td className="px-5 py-4">
            <span className="font-mono text-xs font-semibold text-slate-800">{tag.parameter}</span>
          </td>
          <td className="px-5 py-4 text-sm text-slate-600">{tag.station || '—'}</td>
          <td className="px-5 py-4">
            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold uppercase text-slate-600">
              {tag.protocol}
            </span>
          </td>
          <td className="max-w-72 px-5 py-4">
            <span title={tag.address} className="block truncate font-mono text-xs text-slate-500">{tag.address || '—'}</span>
          </td>
          <td className="px-5 py-4 font-mono text-xs text-slate-600">{tag.scale} / {tag.offset}</td>
          <td className="px-5 py-4 text-sm font-medium text-slate-600">{tag.unit || '—'}</td>
          <td className="px-5 py-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              tag.enabled
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              <span className={`size-1.5 rounded-full ${tag.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {tag.enabled ? 'Aktif' : 'Nonaktif'}
            </span>
          </td>
        </tr>
      ))}
    </CatalogTable>
  );
}

export default function ResourceCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = parseCatalogView(searchParams.get('view'));
  const requestedPlantId = searchParams.get('plta') ?? '';

  const setView = (view: CatalogView) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('view', view);
      if (view !== 'tags') nextParams.delete('plta');
      return nextParams;
    });
  };

  const openTags = (pltaId: string) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('view', 'tags');
      nextParams.set('plta', pltaId);
      return nextParams;
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">Katalog Monitoring</h1>
          <p className="page-description">
            Lihat struktur Wilayah Sungai, PLTA, serta tag dan parameter yang tersedia di server.
          </p>
        </div>

        <CatalogTabs activeView={activeView} onChange={setView} />
      </div>

      <div
        id={`catalog-panel-${activeView}`}
        role="tabpanel"
        aria-labelledby={`catalog-tab-${activeView}`}
        tabIndex={0}
        className="outline-none"
      >
        {activeView === 'ws' && <RiverBasinsCatalog />}
        {activeView === 'plta' && <PlantsCatalog onOpenTags={openTags} />}
        {activeView === 'tags' && (
          <TagsCatalog requestedPlantId={requestedPlantId} onPlantChange={openTags} />
        )}
      </div>
    </div>
  );
}
