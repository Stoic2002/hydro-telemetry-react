import Skeleton from '../atoms/Skeleton';
import type { DashboardSkeletonVariant } from './dashboardSkeletonVariant';

function PageHeadingSkeleton() {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="space-y-2">
        <Skeleton className="h-6 w-44 rounded-md" />
        <Skeleton className="h-3 w-72 max-w-[70vw] rounded" />
      </div>
      <Skeleton className="h-10 w-44 max-w-full rounded-md" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:justify-between">
        <Skeleton className="h-10 w-full rounded-md sm:w-72" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_88px] gap-4 bg-slate-50 px-4 py-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={`table-head-${index}`} className="h-3 w-full rounded" />
          ))}
        </div>
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <div
            key={`table-row-${rowIndex}`}
            className="grid grid-cols-[1.5fr_1fr_0.8fr_88px] gap-4 border-t border-surface-overlay px-4 py-4"
          >
            {Array.from({ length: 4 }, (_, columnIndex) => (
              <Skeleton
                key={`table-cell-${rowIndex}-${columnIndex}`}
                className="h-3 w-full rounded"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TelemeteringSkeleton() {
  return (
    <>
      <div className="border-t border-slate-200 pt-5">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="mt-4 h-28 w-full rounded-md" />
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
          <Skeleton className="h-[360px] rounded-md" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Skeleton className="h-[172px] rounded-md" />
            <Skeleton className="h-[172px] rounded-md" />
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 pt-5">
        <Skeleton className="h-5 w-36 rounded" />
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={`telemetry-zone-${index}`} className="h-72 rounded-md" />
          ))}
        </div>
        <Skeleton className="mt-5 h-[380px] rounded-md" />
      </div>
    </>
  );
}

function TrendsSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-4 border-y border-slate-200 py-4 sm:flex-row">
        <Skeleton className="h-10 w-full rounded-md sm:w-64" />
        <Skeleton className="h-10 w-full rounded-md sm:w-64" />
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded" />
        </div>
        <div className="mt-5 grid grid-cols-2 border-y border-surface-overlay lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`trend-stat-${index}`} className="px-3 py-3 sm:px-4">
              <Skeleton className="h-2.5 w-16 rounded" />
              <Skeleton className="mt-2 h-4 w-24 max-w-full rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-[330px] rounded-md" />
      </div>
    </>
  );
}

function ForecastingSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={`forecast-stat-${index}`} className="h-24 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-md" />
    </>
  );
}

function UploadSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
        <Skeleton className="size-10 shrink-0 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-3 w-64 max-w-full rounded" />
        </div>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-5 sm:p-6">
          <Skeleton className="h-60 rounded-md" />
        </div>
        <div className="space-y-5 border-t border-slate-200 bg-slate-50/60 p-5 lg:border-l lg:border-t-0">
          <Skeleton className="h-11 rounded-md" />
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="w-full max-w-3xl rounded-md border border-slate-200 bg-white p-4 sm:p-6">
      <Skeleton className="h-5 w-40 rounded" />
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Skeleton className="h-10 rounded-md" />
        <Skeleton className="h-10 rounded-md" />
      </div>
      <Skeleton className="mt-5 h-10 w-full rounded-md" />
      <Skeleton className="mt-5 h-28 w-full rounded-md" />
      <div className="mt-6 flex justify-end gap-3">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </div>
  );
}

export default function DashboardPageSkeleton({
  variant = 'default',
}: {
  variant?: DashboardSkeletonVariant;
}) {
  return (
    <div role="status" aria-label="Memuat halaman" className="flex w-full flex-col gap-5 py-1">
      <PageHeadingSkeleton />
      {variant === 'overview' && <Skeleton className="h-[560px] rounded-md" />}
      {variant === 'telemetering' && <TelemeteringSkeleton />}
      {variant === 'trends' && <TrendsSkeleton />}
      {variant === 'forecasting' && <ForecastingSkeleton />}
      {variant === 'table' && <TableSkeleton />}
      {variant === 'upload' && <UploadSkeleton />}
      {variant === 'form' && <FormSkeleton />}
      {variant === 'default' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={`default-card-${index}`} className="h-28 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-[360px] rounded-md" />
        </>
      )}
      <span className="sr-only">Memuat halaman...</span>
    </div>
  );
}
