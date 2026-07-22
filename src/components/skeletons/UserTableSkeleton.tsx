import Skeleton from '../atoms/Skeleton';

export default function UserTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Memuat daftar pengguna" className="flex flex-col">
      {Array.from({ length: rows }, (_, index) => (
        <div key={`user-row-skeleton-${index}`} className="flex h-[65px] items-center gap-4 border-b border-slate-100 px-5">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className={`h-3.5 rounded-md ${index % 2 === 0 ? 'w-36' : 'w-44'}`} />
              <Skeleton className="h-2.5 w-52 max-w-[32vw] rounded-md" />
            </div>
          </div>
          <div className="hidden w-[160px] shrink-0 sm:block"><Skeleton className="h-6 w-24 rounded-full" /></div>
          <div className="hidden w-[140px] shrink-0 sm:block"><Skeleton className="h-3 w-16 rounded-md" /></div>
          <div className="w-[70px] shrink-0"><Skeleton className="size-7 rounded-lg" /></div>
        </div>
      ))}
      <span className="sr-only">Memuat daftar pengguna...</span>
    </div>
  );
}
