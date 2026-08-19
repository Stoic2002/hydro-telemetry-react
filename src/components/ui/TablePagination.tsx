import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Satuan yang dibaca operator, misalnya "laporan" atau "pengguna". */
  itemLabel: string;
  isBusy?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

const NAV_CLASSES =
  'flex size-[30px] cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-surface-raised text-text-secondary transition-colors hover:bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/30 disabled:cursor-not-allowed disabled:text-disabled disabled:hover:bg-surface-raised';

export default function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  itemLabel,
  isBusy = false,
  onPrevious,
  onNext,
  className = '',
}: TablePaginationProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex items-center justify-between gap-3 border-t border-border-subtle bg-surface-base px-4 py-2.5 ${className}`}
    >
      <span className="text-[11.5px] text-text-muted">
        Menampilkan {firstItem}–{lastItem} dari {total} {itemLabel}
      </span>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          disabled={page <= 1 || isBusy}
          onClick={onPrevious}
          className={NAV_CLASSES}
        >
          <ChevronLeft size={13} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Halaman berikutnya"
          disabled={page >= totalPages || isBusy}
          onClick={onNext}
          className={NAV_CLASSES}
        >
          <ChevronRight size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
