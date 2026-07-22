import Skeleton from '../atoms/Skeleton';

export default function MapSkeleton() {
  return (
    <div role="status" aria-label="Memuat peta" className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-5">
      <Skeleton className="h-full w-full rounded-xl" />
      <div className="absolute bottom-8 left-8 flex gap-3">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="size-5 rounded-full" />
      </div>
      <span className="sr-only">Memuat peta...</span>
    </div>
  );
}
