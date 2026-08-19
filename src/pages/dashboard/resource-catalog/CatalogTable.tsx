import type { FormEvent, ReactNode } from 'react';
import { FileSearch, Search } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import RefetchBar from '../../../components/ui/RefetchBar';
import TablePagination from '../../../components/ui/TablePagination';
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
  const tabs: Array<{ value: CatalogView; label: string }> = [
    { value: 'ws', label: 'Wilayah Sungai' },
    { value: 'plta', label: 'PLTA' },
    { value: 'tags', label: 'Tag & Parameter' },
  ];

  return (
    <div
      role="tablist"
      aria-label="Jenis katalog monitoring"
      className="grid w-full grid-cols-1 gap-1 rounded-md bg-surface-overlay p-1 sm:w-fit sm:grid-cols-3"
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
            className={`inline-flex h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3.5 text-[12.5px] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/30 ${
              isActive
                ? 'border border-border-subtle bg-white font-semibold text-brand-primary-strong'
                : 'border border-transparent font-medium text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function StateTableCell({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8">
        {children}
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
  return (
    <>
      {/* Baris filter berdiri sendiri di atas tabel — tabel tidak dibungkus kartu lagi. */}
      <div className="flex flex-col gap-2.5 border-b border-border-subtle py-4 lg:flex-row lg:flex-wrap lg:items-center">
        <form onSubmit={onSearch} className="flex min-w-0 items-center gap-2 lg:w-72 lg:shrink-0">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search size={15} className="pointer-events-none absolute left-3 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              maxLength={100}
              placeholder={searchPlaceholder}
              className="h-9 w-full min-w-0 rounded-sm border border-border-subtle bg-white pr-3 pl-8.5 text-[12.5px] text-slate-900 outline-none transition-[border-color,box-shadow] hover:border-slate-300 focus:border-brand-primary-strong focus:ring-[3px] focus:ring-brand-primary-strong/15 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="h-9 shrink-0 cursor-pointer rounded-sm border border-border-subtle bg-white px-3 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cari
          </button>
          {onClearSearch && searchInput.length > 0 && (
            <button
              type="button"
              onClick={onClearSearch}
              className="h-9 shrink-0 cursor-pointer rounded-sm px-2 text-[12.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
            >
              Bersihkan
            </button>
          )}
        </form>

        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}

        {!isLoading && !isError && (
          <span className="text-[11.5px] text-slate-500 lg:ml-auto">
            {total} {itemLabel}
          </span>
        )}
      </div>

      <section className="mt-5 flex flex-col overflow-hidden rounded-md border border-border-subtle bg-white">
        <RefetchBar isRefetching={isFetching && !isLoading} />

        <div className="overflow-x-auto">
          <table className={`w-full border-collapse ${minWidthClassName}`}>
            <thead>
              <tr className="h-9 border-b border-border-subtle bg-surface-overlay">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`table-head-cell px-3.5 text-left ${column.className ?? ''}`}
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
                <StateTableCell colSpan={columns.length}>
                  <ErrorState
                    title="Data belum bisa dimuat"
                    description={errorMessage ?? 'Sambungan ke server terputus sebentar.'}
                    onRetry={onRetry}
                  />
                </StateTableCell>
              ) : isEmpty ? (
                <StateTableCell colSpan={columns.length}>
                  <EmptyState
                    icon={<FileSearch size={19} />}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </StateTableCell>
              ) : children}
            </tbody>
          </table>
        </div>

        {!isLoading && !isError && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_LIMIT}
            itemLabel={itemLabel}
            isBusy={isFetching}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
          />
        )}
      </section>
    </>
  );
}
