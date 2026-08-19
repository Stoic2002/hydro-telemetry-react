import {
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { Building2, Database, Tags } from 'lucide-react';
import Select from '../../../components/atoms/Select';
import Skeleton from '../../../components/atoms/Skeleton';
import Badge from '../../../components/atoms/Badge';
import {
  usePlantCatalogQuery,
  usePLTAListQuery,
  usePLTATagsQuery,
  useRiverBasinsQuery,
} from '../../../features/plta/api/queries';
import { getPLTAErrorMessage } from '../../../features/plta/error';
import type {
  PlantTagListParams,
  PlantTagProtocol,
} from '../../../features/plta/model';
import CatalogTable from './CatalogTable';
import {
  PAGE_LIMIT,
  RIVER_BASIN_LOOKUP_LIMIT,
  TAG_PROTOCOLS,
  formatCoordinate,
} from './model';

export function RiverBasinsCatalog() {
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
        <tr key={riverBasin.id} className="border-b border-surface-overlay transition-colors last:border-b-0 hover:bg-slate-50/60">
          <td className="px-3.5 py-2.5 font-mono text-[11.5px] font-medium tabular-nums text-text-secondary">{riverBasin.code}</td>
          <td className="px-3.5 py-2.5 text-[12.5px] font-medium text-text-primary">{riverBasin.name}</td>
          <td className="px-3.5 py-2.5 text-[11.5px] leading-[1.5] text-text-muted">
            <span className="line-clamp-2">{riverBasin.description || '—'}</span>
          </td>
          <td className="px-3.5 py-2.5 text-center text-[12.5px] font-medium text-text-secondary">
            {plantsCatalogQuery.isPending ? (
              <Skeleton className="mx-auto h-3.5 w-8 rounded-md" />
            ) : plantsCatalogQuery.isError ? '—' : (plantCountsByRiverBasin.get(riverBasin.id) ?? 0)}
          </td>
        </tr>
      ))}
    </CatalogTable>
  );
}

export function PlantsCatalog({ onOpenTags }: { onOpenTags: (pltaId: string) => void }) {
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
        <tr key={plant.id} className="border-b border-surface-overlay transition-colors last:border-b-0 hover:bg-slate-50/60">
          <td className="px-3.5 py-2.5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[12.5px] font-medium text-text-primary">{plant.name}</span>
              <span className="font-mono text-[11px] font-medium text-slate-400">{plant.code}</span>
            </div>
          </td>
          <td className="px-3.5 py-2.5 text-[12.5px] text-text-secondary">
            {riverBasinNames.get(plant.riverBasinId) ?? 'Wilayah sungai tidak ditemukan'}
          </td>
          <td className="px-3.5 py-2.5 font-mono text-[11.5px] font-medium tabular-nums text-text-secondary">
            {plant.capacityMw === null
              ? '—'
              : `${plant.capacityMw.toLocaleString('id-ID', { maximumFractionDigits: 2 })} MW`}
          </td>
          <td className="px-3.5 py-2.5 font-mono text-[11.5px] text-text-muted">
            {formatCoordinate(plant.latitude)}, {formatCoordinate(plant.longitude)}
          </td>
          <td className="px-3.5 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <span className={`size-2 rounded-full ${plant.isActive ? 'bg-status-success-strong' : 'bg-slate-300'}`} />
              {plant.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </td>
          <td className="px-3.5 py-2.5">
            <button
              type="button"
              onClick={() => onOpenTags(plant.id)}
              className="inline-flex h-[30px] cursor-pointer items-center rounded-sm border border-border-subtle bg-white px-2.5 text-[11.5px] font-semibold text-brand-primary-strong transition-colors hover:border-brand-tint-border hover:bg-brand-tint"
            >
              Lihat Parameter
            </button>
          </td>
        </tr>
      ))}
    </CatalogTable>
  );
}

export function TagsCatalog({
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
        <tr key={tag.id} className="border-b border-surface-overlay transition-colors last:border-b-0 hover:bg-slate-50/60">
          <td className="px-3.5 py-2.5">
            <span className="font-mono text-[11.5px] font-medium text-text-primary">{tag.parameter}</span>
          </td>
          <td className="px-3.5 py-2.5 text-[12.5px] text-text-secondary">{tag.station || '—'}</td>
          <td className="px-3.5 py-2.5">
            <Badge tone="slate" mono>{tag.protocol}</Badge>
          </td>
          <td className="max-w-72 px-3.5 py-2.5">
            <span title={tag.address} className="block truncate font-mono text-[11.5px] text-text-muted">{tag.address || '—'}</span>
          </td>
          <td className="px-3.5 py-2.5 font-mono text-[11.5px] tabular-nums text-text-secondary">{tag.scale} / {tag.offset}</td>
          <td className="px-3.5 py-2.5 text-[12.5px] text-text-secondary">{tag.unit || '—'}</td>
          <td className="px-3.5 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <span className={`size-2 rounded-full ${tag.enabled ? 'bg-status-success-strong' : 'bg-slate-300'}`} />
              {tag.enabled ? 'Aktif' : 'Nonaktif'}
            </span>
          </td>
        </tr>
      ))}
    </CatalogTable>
  );
}

