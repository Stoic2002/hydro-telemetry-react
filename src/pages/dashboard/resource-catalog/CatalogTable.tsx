import type { FormEvent, ReactNode } from 'react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Tags,
  Waves,
} from 'lucide-react';
import Skeleton from '../../../components/atoms/Skeleton';
import ResourceTableSkeleton from '../../../components/skeletons/ResourceTableSkeleton';
import { PAGE_LIMIT, type CatalogView } from './model';

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

export function CatalogTabs({
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

export default function CatalogTable({
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

